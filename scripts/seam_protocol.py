"""Strict proof-carrying handoff protocol primitives (stdlib only)."""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any

MANIFEST_SCHEMA = "seam.handoff.v1"


def canonical_contract(contract: dict[str, Any]) -> bytes:
    """The exact bytes covered by the integrity/version digest."""
    return json.dumps(contract, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def contract_sha256(contract: dict[str, Any]) -> str:
    return hashlib.sha256(canonical_contract(contract)).hexdigest()


def required_ids(contract: dict[str, Any]) -> list[str]:
    deps = contract.get("dependencies")
    if not isinstance(deps, list) or not all(isinstance(d, dict) and isinstance(d.get("id"), str) for d in deps):
        raise ValueError("contract dependencies must be objects with string ids")
    return [d["id"] for d in deps]


def build_manifest(contract: dict[str, Any], verified: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build from the compiled contract; optional evidence is only consistency-checked."""
    verified_statuses = {item.get("id"): item.get("status") for item in (verified or {}).get("dependencies", []) if isinstance(item, dict)}
    obligations = []
    for dependency in contract.get("dependencies", []):
        dep_id, status = dependency["id"], dependency.get("evidence_status")
        if status not in {"SUPPORTED", "PROVEN"}:
            raise ValueError(f"compiled contract classification missing or invalid for {dep_id}")
        if verified is not None and verified_statuses.get(dep_id) != status:
            raise ValueError(f"compiled contract classification does not match verified evidence for {dep_id}")
        obligations.append({"id": dep_id, "evidence_status": status})
    return {"schema": MANIFEST_SCHEMA, "contract_id": contract.get("contract_id"),
            "contract_sha256": contract_sha256(contract), "obligations": obligations}


def render_manifest(manifest: dict[str, Any]) -> str:
    return "<SEAM_MANIFEST>\n" + json.dumps(manifest, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n</SEAM_MANIFEST>"


def extract_manifest(description: str) -> dict[str, Any]:
    matches = re.findall(r"<SEAM_MANIFEST>\s*(.*?)\s*</SEAM_MANIFEST>", description, flags=re.DOTALL)
    if len(matches) != 1:
        raise ValueError("expected exactly one <SEAM_MANIFEST> block")
    try:
        value = json.loads(matches[0])
    except json.JSONDecodeError as error:
        raise ValueError(f"manifest JSON is malformed: {error.msg}") from error
    if not isinstance(value, dict):
        raise ValueError("manifest must be a JSON object")
    return value


@dataclass(frozen=True)
class Validation:
    carried: list[str]
    missing: list[str]
    errors: list[str]

    @property
    def valid(self) -> bool:
        return not self.errors and not self.missing


def validate_manifest(manifest: dict[str, Any], contract: dict[str, Any]) -> Validation:
    errors: list[str] = []
    required = required_ids(contract)
    if manifest.get("schema") != MANIFEST_SCHEMA:
        errors.append(f"unknown manifest schema: {manifest.get('schema')!r}")
    if manifest.get("contract_id") != contract.get("contract_id"):
        errors.append("manifest contract_id does not match compiled contract")
    if manifest.get("contract_sha256") != contract_sha256(contract):
        errors.append("manifest contract_sha256 is stale or does not match compiled contract")
    obligations = manifest.get("obligations")
    if not isinstance(obligations, list):
        return Validation([], required, errors + ["manifest obligations must be a list"])
    expected_statuses = {item["id"]: item.get("evidence_status") for item in contract["dependencies"]}
    ids: list[str] = []
    for item in obligations:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str) or item.get("evidence_status") not in {"SUPPORTED", "PROVEN"}:
            errors.append("each obligation requires string id and SUPPORTED or PROVEN evidence_status")
            continue
        ids.append(item["id"])
    duplicates = sorted({item for item in ids if ids.count(item) > 1})
    if duplicates:
        errors.append("duplicate obligation ids: " + ", ".join(duplicates))
    unknown = sorted(set(ids) - set(required))
    if unknown:
        errors.append("unknown obligation ids: " + ", ".join(unknown))
    for item in obligations:
        if isinstance(item, dict) and item.get("id") in expected_statuses and item.get("evidence_status") != expected_statuses[item["id"]]:
            errors.append(f"evidence_status mismatch for {item['id']}: expected {expected_statuses[item['id']]}")
    return Validation([item for item in required if item in ids], [item for item in required if item not in ids], errors)
