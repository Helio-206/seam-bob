"""Outcome witness: run the real suite and associate its named checks with obligations."""
from __future__ import annotations

import json
import subprocess
import re
from pathlib import Path
from typing import Any

from seam_protocol import contract_sha256, validate_manifest


def _run(command: list[str], cwd: Path) -> tuple[str, str]:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True)
    return ("PASS" if result.returncode == 0 else "FAIL", result.stdout + result.stderr)


def _counts(output: str) -> dict[str, int] | dict[str, str]:
    passed = re.search(r"(?:ℹ\s+pass|# pass)\s+(\d+)", output)
    total = re.search(r"(?:ℹ\s+tests|# tests)\s+(\d+)", output)
    return {"passed": int(passed.group(1)), "total": int(total.group(1))} if passed and total else {}


def witness(root: Path, manifest: dict[str, Any], contract: dict[str, Any], *, runner=_run) -> dict[str, Any]:
    validation = validate_manifest(manifest, contract)
    if not validation.valid:
        return {"schema": "seam.witness.v1", "contract_id": contract.get("contract_id"), "contract_sha256": contract_sha256(contract),
                "handoff_integrity": "FAIL", "outcome_integrity": "NOT RUN", "obligations": [],
                "reason": "; ".join(validation.errors + (["missing: " + ", ".join(validation.missing)] if validation.missing else []))}
    normal_status, normal_output = runner(["npm", "test", "--prefix", "demo-workspace"], root)
    evaluator_status, evaluator_output = runner(["bash", "scripts/run_system_evaluator.sh"], root)
    all_output = normal_output + "\n" + evaluator_output
    obligations = []
    for dependency in contract["dependencies"]:
        postconditions = []
        for check in dependency.get("postconditions", []):
            passed = check["check"] in all_output and evaluator_status == "PASS"
            postconditions.append({"id": check["id"], "evaluator_check": check["check"], "status": "PASS" if passed else "FAIL"})
        obligations.append({"id": dependency["id"], "carried": True,
                            "evidence_status": next(item["evidence_status"] for item in manifest["obligations"] if item["id"] == dependency["id"]),
                            "postconditions": postconditions, "fulfilled": bool(postconditions) and all(p["status"] == "PASS" for p in postconditions)})
    outcome = "PASS" if normal_status == evaluator_status == "PASS" and all(item["fulfilled"] for item in obligations) else "FAIL"
    return {"schema": "seam.witness.v1", "contract_id": contract.get("contract_id"), "contract_sha256": contract_sha256(contract),
            "handoff_integrity": "PASS", "outcome_integrity": outcome, "obligations": obligations,
            "normal_tests": {"status": normal_status, **_counts(normal_output), "output": normal_output},
            "system_evaluator": {"status": evaluator_status, **_counts(evaluator_output), "output": evaluator_output}}


def receipt(w: dict[str, Any]) -> str:
    lines = ["SEAM RECEIPT", "", "CONTRACT", str(w["contract_id"]), "sha256:" + str(w["contract_sha256"]), "", "HANDOFF INTEGRITY", w["handoff_integrity"], "", "OUTCOME INTEGRITY", w["outcome_integrity"]]
    for label, key in [("normal tests", "normal_tests"), ("system invariants", "system_evaluator")]:
        item = w.get(key, {})
        if "passed" in item: lines.append(f"{label}: {item['passed']} / {item['total']} {item['status']}")
    for item in w.get("obligations", []): lines.append(f"{item['id']}: requested ✓ carried {'✓' if item['carried'] else '✕'} fulfilled {'✓' if item['fulfilled'] else '✕'}")
    return "\n".join(lines)
