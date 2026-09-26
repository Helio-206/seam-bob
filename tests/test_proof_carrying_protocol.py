from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from seam_protocol import build_manifest, render_manifest  # noqa: E402
from seam_witness import witness  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
HOOK = ROOT / "demo-workspace/.bob/hooks/semantic_boundary_gate.py"


def contract() -> dict:
    return json.loads((ROOT / "runtime-contracts/customer-field-migration.json").read_text())


def verified() -> dict:
    return {"dependencies": [
        {"id": "CLIENT_N_MINUS_ONE_PAYLOAD", "status": "SUPPORTED"},
        {"id": "ROLLING_N_N_PLUS_1_COMPAT", "status": "SUPPORTED"},
        {"id": "LIVE_N_WRITE_COMPAT", "status": "PROVEN"},
    ]}


def invoke(description: str, c: dict | None = None) -> subprocess.CompletedProcess[str]:
    with tempfile.TemporaryDirectory() as directory:
        directory_path = Path(directory)
        cpath, dpath = directory_path / "contract.json", directory_path / "description.txt"
        cpath.write_text(json.dumps(c or contract()))
        dpath.write_text(description)
        return subprocess.run([sys.executable, str(HOOK), "--contract", str(cpath), "--description-file", str(dpath), "--events", str(directory_path / "events")], text=True, capture_output=True)


class ProofCarryingProtocolTests(unittest.TestCase):
    def valid_description(self, manifest: dict | None = None) -> str:
        return "Migrate customer name: customer_name to full_name during rolling deployment.\n" + render_manifest(manifest or build_manifest(contract(), verified()))

    def assert_block(self, description: str, expected: str) -> None:
        result = invoke(description)
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn(expected, result.stdout + result.stderr)

    def test_no_manifest_blocks(self): self.assert_block("Migrate customer name: customer_name to full_name during rolling deployment.", "expected exactly one")
    def test_malformed_manifest_blocks(self): self.assert_block("Migrate customer name: customer_name to full_name during rolling deployment.\n<SEAM_MANIFEST>{oops}</SEAM_MANIFEST>", "malformed")
    def test_wrong_hash_blocks(self):
        manifest = build_manifest(contract(), verified()); manifest["contract_sha256"] = "0" * 64
        self.assert_block(self.valid_description(manifest), "contract_sha256")
    def test_missing_live_blocks_even_with_keywords(self):
        manifest = build_manifest(contract(), verified()); manifest["obligations"] = manifest["obligations"][:-1]
        self.assert_block("Migrate customer name: customer_name to full_name during rolling deployment; old version still writes customer_name and N+1 must read it.\n" + render_manifest(manifest), "LIVE_N_WRITE_COMPAT")
    def test_duplicate_blocks(self):
        manifest = build_manifest(contract(), verified()); manifest["obligations"].append(manifest["obligations"][0].copy())
        self.assert_block(self.valid_description(manifest), "duplicate")
    def test_unknown_blocks(self):
        manifest = build_manifest(contract(), verified()); manifest["obligations"].append({"id": "UNKNOWN", "evidence_status": "SUPPORTED"})
        self.assert_block(self.valid_description(manifest), "unknown")
    def test_complete_manifest_allows(self):
        result = invoke(self.valid_description())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("ALLOWED", result.stdout)

    def test_live_status_downgrade_blocks(self):
        manifest = build_manifest(contract(), verified())
        next(item for item in manifest["obligations"] if item["id"] == "LIVE_N_WRITE_COMPAT")["evidence_status"] = "SUPPORTED"
        self.assert_block(self.valid_description(manifest), "evidence_status mismatch for LIVE_N_WRITE_COMPAT")

    def test_client_status_upgrade_blocks(self):
        manifest = build_manifest(contract(), verified())
        next(item for item in manifest["obligations"] if item["id"] == "CLIENT_N_MINUS_ONE_PAYLOAD")["evidence_status"] = "PROVEN"
        self.assert_block(self.valid_description(manifest), "evidence_status mismatch for CLIENT_N_MINUS_ONE_PAYLOAD")

    def test_handoff_pass_outcome_fail_is_distinct(self):
        def fake_runner(command, _cwd):
            output = "\n".join(check["check"] for dep in contract()["dependencies"] for check in dep["postconditions"] if check["id"] != "live-n-write-read")
            return ("FAIL" if command[0] == "bash" else "PASS", output)
        result = witness(ROOT, build_manifest(contract(), verified()), contract(), runner=fake_runner)
        self.assertEqual(result["handoff_integrity"], "PASS")
        self.assertEqual(result["outcome_integrity"], "FAIL")
        live = next(item for item in result["obligations"] if item["id"] == "LIVE_N_WRITE_COMPAT")
        self.assertTrue(live["carried"]); self.assertFalse(live["fulfilled"])


if __name__ == "__main__": unittest.main()
