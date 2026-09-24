#!/usr/bin/env python3
"""Deterministic PreToolUse semantic-boundary gate.

The hook consumes the same JSON stdin protocol as log_tool.py:
tool_name and tool_input.description.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


CONTRACT_ID = "customer-field-migration"
TOOL_NAME = "spawn_subagent"
BLOCK_EXIT = 2
CONTRACT_RELATIVE_PATH = Path("runtime-contracts/customer-field-migration.json")


def default_contract_path() -> Path:
    # Walk upward until the release-level contract is found. This keeps the
    # fallback outside the Bob-visible workspace in both source and release layouts.
    for parent in Path(__file__).resolve().parents:
        candidate = parent / CONTRACT_RELATIVE_PATH
        if candidate.is_file():
            return candidate
    return Path(__file__).resolve().parents[3] / CONTRACT_RELATIVE_PATH


def resolve_contract_path(explicit: Path | None) -> Path:
    configured = os.environ.get("SEMANTIC_BOUNDARY_CONTRACT_PATH")
    if configured:
        return Path(configured).expanduser()
    if explicit is not None:
        return explicit
    return default_contract_path()


def load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"contract must be an object: {path}")
    return value


def matches_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(pattern, text, re.IGNORECASE | re.DOTALL) for pattern in patterns)


def dependency_observed(description: str, dependency: dict[str, Any]) -> bool:
    return all(
        matches_any(description, group.get("any_of", []))
        for group in dependency.get("marker_groups", [])
    )


def contract_applies(description: str, contract: dict[str, Any]) -> bool:
    applicability = contract.get("applies_when", {})
    required = applicability.get("all_of", [])
    contextual = applicability.get("any_of", [])
    return all(matches_any(description, [pattern]) for pattern in required) and matches_any(
        description, contextual
    )


def description_hash(description: str) -> str:
    return hashlib.sha256(description.encode("utf-8")).hexdigest()


def append_event(path: Path, event: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n")


def decision_event(
    *,
    tool: str,
    contract: dict[str, Any],
    decision: str,
    required: list[str],
    observed: list[str],
    missing: list[str],
    description: str,
    evidence: list[str],
) -> dict[str, Any]:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tool": tool,
        "contract_id": contract.get("contract_id", CONTRACT_ID),
        "decision": decision,
        "required_dependencies": required,
        "observed_dependencies": observed,
        "missing_dependencies": missing,
        "description_hash": description_hash(description),
        "evidence_reference": evidence,
    }


def evaluate(
    *,
    tool: str,
    description: str,
    contract: dict[str, Any],
    events_path: Path,
) -> tuple[int, str, dict[str, Any]]:
    dependencies = contract.get("dependencies", [])
    required = [item["id"] for item in dependencies]

    if tool != TOOL_NAME:
        event = decision_event(
            tool=tool,
            contract=contract,
            decision="ALLOW",
            required=required,
            observed=[],
            missing=[],
            description=description,
            evidence=["contract_not_applicable:tool_is_not_spawn_subagent"],
        )
        append_event(events_path, event)
        return 0, "SEMANTIC BOUNDARY ALLOWED\nContract not applicable to this tool.", event

    if not contract_applies(description, contract):
        event = decision_event(
            tool=tool,
            contract=contract,
            decision="ALLOW",
            required=required,
            observed=[],
            missing=[],
            description=description,
            evidence=["contract_not_applicable:customer-field-migration markers absent"],
        )
        append_event(events_path, event)
        return 0, "SEMANTIC BOUNDARY ALLOWED\nContract not applicable to this handoff.", event

    observed = [
        item["id"]
        for item in dependencies
        if dependency_observed(description, item)
    ]
    missing = [item for item in required if item not in observed]
    if not missing:
        event = decision_event(
            tool=tool,
            contract=contract,
            decision="ALLOW",
            required=required,
            observed=observed,
            missing=[],
            description=description,
            evidence=["contract.marker_groups:all_required_groups_matched"],
        )
        append_event(events_path, event)
        return 0, "SEMANTIC BOUNDARY ALLOWED\nObserved: " + ", ".join(observed), event

    by_id = {item["id"]: item for item in dependencies}
    lines = ["SEMANTIC BOUNDARY BLOCKED", "", "Missing:"]
    for dependency_id in missing:
        lines.append(f"- {dependency_id}")
    lines.extend(["", "Why it matters:"])
    for dependency_id in missing:
        lines.append(by_id[dependency_id]["meaning"])
    lines.extend(["", "Evidence:"])
    for dependency_id in missing:
        if dependency_id == "LIVE_N_WRITE_COMPAT":
            lines.append("Without dependency: 4/5 system invariants in 3/3 controlled runs.")
            lines.append("With dependency: 5/5 in 3/3 controlled runs.")
        else:
            lines.append(f"Required deterministic marker groups were not all observed for {dependency_id}.")
    lines.extend(["", "Required repair:"])
    for dependency_id in missing:
        lines.append(by_id[dependency_id]["remediation"])

    event = decision_event(
        tool=tool,
        contract=contract,
        decision="BLOCK",
        required=required,
        observed=observed,
        missing=missing,
        description=description,
        evidence=[f"contract.marker_groups:missing:{dependency_id}" for dependency_id in missing],
    )
    append_event(events_path, event)
    return BLOCK_EXIT, "\n".join(lines), event


def parse_hook_input() -> tuple[str, str]:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError) as error:
        raise ValueError(f"malformed hook input: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("malformed hook input: expected a JSON object")
    tool = payload.get("tool_name")
    tool_input = payload.get("tool_input")
    if not isinstance(tool, str):
        raise ValueError("malformed hook input: missing tool_name")
    if tool != TOOL_NAME:
        return tool, ""
    if not isinstance(tool_input, dict):
        raise ValueError("malformed hook input: tool_input must be an object")
    description = tool_input.get("description")
    if not isinstance(description, str):
        raise ValueError("malformed hook input: spawn_subagent.description must be a string")
    return tool, description


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hook", action="store_true")
    parser.add_argument("--description-file")
    parser.add_argument("--contract", type=Path)
    parser.add_argument("--events", type=Path)
    args = parser.parse_args(argv)

    contract_path = resolve_contract_path(args.contract)
    events_path = args.events or Path(".semantic-boundary/events.ndjson")
    try:
        contract = load_json(contract_path)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print("SEMANTIC BOUNDARY BLOCKED", file=sys.stderr)
        print(f"Hook error: unable to load semantic boundary contract: {contract_path}", file=sys.stderr)
        print(f"Reason: {error}", file=sys.stderr)
        return BLOCK_EXIT

    try:
        if args.description_file:
            description = Path(args.description_file).read_text(encoding="utf-8")
            tool = TOOL_NAME
        else:
            tool, description = parse_hook_input()
    except (OSError, ValueError) as error:
        event = decision_event(
            tool=TOOL_NAME,
            contract=contract,
            decision="BLOCK",
            required=[item["id"] for item in contract.get("dependencies", [])],
            observed=[],
            missing=[item["id"] for item in contract.get("dependencies", [])],
            description="",
            evidence=[f"malformed_input:{error}"],
        )
        append_event(events_path, event)
        print("SEMANTIC BOUNDARY BLOCKED", file=sys.stderr)
        print(f"Reason: {error}", file=sys.stderr)
        return BLOCK_EXIT

    code, message, _event = evaluate(
        tool=tool,
        description=description,
        contract=contract,
        events_path=events_path,
    )
    print(message, file=sys.stderr if code else sys.stdout)
    return code


if __name__ == "__main__":
    raise SystemExit(main())
