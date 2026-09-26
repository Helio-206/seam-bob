from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from seam_discovery import (  # noqa: E402
    DEFAULT_CONTRACT,
    Fact,
    compile_contract,
    derive_candidates,
    discover,
    parse_summary,
    semantically_compatible,
    verify,
    write_json,
    DeterministicRepositoryProvider,
)


ROOT = Path(__file__).resolve().parents[1]


class SyntheticApiProvider:
    """Tiny test provider standing in for a second repository shape."""

    def facts(self, workspace: Path) -> list[Fact]:
        source = (workspace / "api.md").read_text(encoding="utf-8")
        facts = []
        for fact_id, phrase in [
            ("api_version_coexistence", "v1 and v2 coexist"),
            ("api_old_field", "v1 clients send displayName"),
            ("api_new_field", "v2 migrates the field to profileName"),
        ]:
            if phrase in source:
                facts.append(Fact(fact_id, "api.md", phrase, "Synthetic API rollout fixture."))
        return facts


class SemanticDiscoveryTests(unittest.TestCase):
    def test_repository_fact_extraction_and_candidates_have_provenance(self) -> None:
        facts = DeterministicRepositoryProvider().facts(ROOT / "demo-workspace")
        ids = {fact.id for fact in facts}
        self.assertTrue({"version_coexistence", "version_n_writes_legacy_field", "migration_adds_full_name"} <= ids)
        candidates = {item["id"]: item for item in derive_candidates(facts)}
        self.assertEqual(set(candidates), {
            "CLIENT_N_MINUS_ONE_PAYLOAD", "ROLLING_N_N_PLUS_1_COMPAT", "LIVE_N_WRITE_COMPAT"
        })
        live = candidates["LIVE_N_WRITE_COMPAT"]
        self.assertEqual(live["status"], "CANDIDATE")
        self.assertEqual(live["confidence"], "HIGH")
        self.assertIn("version_coexistence", live["provenance"]["facts"])
        self.assertIn("version_n_writes_legacy_field", live["provenance"]["facts"])
        self.assertTrue(all(source["path"] and source["evidence"] for source in live["sources"]))
        self.assertIn("therefore live legacy-only rows can be created", live["discovery_rationale"])

    def test_live_candidate_disappears_when_required_live_write_fact_is_removed(self) -> None:
        facts = DeterministicRepositoryProvider().facts(ROOT / "demo-workspace")
        facts = [fact for fact in facts if fact.id != "version_n_writes_legacy_field"]
        self.assertNotIn("LIVE_N_WRITE_COMPAT", {item["id"] for item in derive_candidates(facts)})

    def test_synthetic_api_fixture_uses_composable_version_and_field_facts(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            (workspace / "api.md").write_text(
                "v1 and v2 coexist. v1 clients send displayName. v2 migrates the field to profileName.",
                encoding="utf-8",
            )
            candidate = derive_candidates(SyntheticApiProvider().facts(workspace))[0]
        self.assertEqual(candidate["id"], "API_PREVIOUS_VERSION_FIELD_COMPAT")
        self.assertEqual(candidate["status"], "CANDIDATE")
        self.assertEqual(len(candidate["sources"]), 3)

    def test_ablation_evidence_parses_and_only_live_dependency_is_proven(self) -> None:
        candidates = discover(ROOT / "demo-workspace")
        evidence = json.loads((ROOT / "evidence/boundary-summary.json").read_text(encoding="utf-8"))
        l0, l1 = parse_summary(evidence)
        self.assertEqual(l0, ["4/5", "4/5", "4/5"])
        self.assertEqual(l1, ["5/5", "5/5", "5/5"])
        verified = verify(candidates, evidence)
        statuses = {item["id"]: item["status"] for item in verified["dependencies"]}
        self.assertEqual(statuses, {
            "CLIENT_N_MINUS_ONE_PAYLOAD": "SUPPORTED",
            "ROLLING_N_N_PLUS_1_COMPAT": "SUPPORTED",
            "LIVE_N_WRITE_COMPAT": "PROVEN",
        })
        live = next(item for item in verified["dependencies"] if item["id"] == "LIVE_N_WRITE_COMPAT")
        self.assertEqual(live["verification"]["evidence_type"], "CONTROLLED_BOUNDARY_ABLATION")
        self.assertIn("this controlled", live["verification"]["evidence_scope"])

    def test_nonmatching_or_malformed_ablation_cannot_mark_live_proven(self) -> None:
        discovered = discover(ROOT / "demo-workspace")
        evidence = json.loads((ROOT / "evidence/boundary-summary.json").read_text(encoding="utf-8"))
        evidence["without_dependency"]["runs"][0]["system_evaluator"] = "5/5"
        verified = verify(discovered, evidence)
        live = next(item for item in verified["dependencies"] if item["id"] == "LIVE_N_WRITE_COMPAT")
        self.assertEqual(live["status"], "SUPPORTED")
        evidence["valid_runs"] = "5/6"
        with self.assertRaises(ValueError):
            parse_summary(evidence)

    def test_compiler_preserves_existing_gate_contract_semantics(self) -> None:
        evidence = json.loads((ROOT / "evidence/boundary-summary.json").read_text(encoding="utf-8"))
        verified = verify(discover(ROOT / "demo-workspace"), evidence)
        contract, report = compile_contract(verified)
        baseline = json.loads(DEFAULT_CONTRACT.read_text(encoding="utf-8"))
        self.assertTrue(semantically_compatible(contract, baseline))
        self.assertEqual(contract, baseline)
        self.assertEqual([item["status"] for item in report], ["SUPPORTED", "SUPPORTED", "PROVEN"])

    def test_generated_contract_runs_through_existing_gate(self) -> None:
        evidence = json.loads((ROOT / "evidence/boundary-summary.json").read_text(encoding="utf-8"))
        contract, _ = compile_contract(verify(discover(ROOT / "demo-workspace"), evidence))
        description = """Migrate customer_name to full_name during rolling deployment. Preserve customer_name for old clients. N+1 supports previous mobile clients. N and N+1 coexist. N may write only customer_name after migration; N+1 reads customer_name when full_name is empty."""
        with tempfile.TemporaryDirectory() as directory:
            generated = Path(directory) / "compiled.json"
            desc = Path(directory) / "description.txt"
            events = Path(directory) / "events.ndjson"
            write_json(generated, contract)
            desc.write_text(description, encoding="utf-8")
            proc = subprocess.run([
                sys.executable, str(ROOT / "demo-workspace/.bob/hooks/semantic_boundary_gate.py"),
                "--description-file", str(desc), "--contract", str(generated), "--events", str(events),
            ], capture_output=True, text=True)
            desc.write_text(
                "Migrate customer name from customer_name to full_name during rolling deployment. "
                "Preserve customer_name for previous mobile clients. "
                "N and N+1 coexist; preserve customer_name, add/backfill full_name, "
                "and defer destructive removal to a later release.",
                encoding="utf-8",
            )
            blocked = subprocess.run([
                sys.executable, str(ROOT / "demo-workspace/.bob/hooks/semantic_boundary_gate.py"),
                "--description-file", str(desc), "--contract", str(generated), "--events", str(events),
            ], capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, proc.stderr + proc.stdout)
        self.assertIn("SEMANTIC BOUNDARY ALLOWED", proc.stdout)
        self.assertEqual(blocked.returncode, 2, blocked.stderr + blocked.stdout)
        self.assertIn("LIVE_N_WRITE_COMPAT", blocked.stderr + blocked.stdout)


if __name__ == "__main__":
    unittest.main()
