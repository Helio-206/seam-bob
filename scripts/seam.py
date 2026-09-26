#!/usr/bin/env python3
"""SEAM Discover → Prove → Compile command line."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from seam_discovery import (
    DEFAULT_CANDIDATES,
    DEFAULT_COMPILED,
    DEFAULT_EVIDENCE,
    DEFAULT_VERIFIED,
    DEFAULT_WORKSPACE,
    ROOT,
    compile_contract,
    discover,
    inspect_report,
    semantically_compatible,
    write_json,
    verify,
)
from seam_protocol import build_manifest, contract_sha256
from seam_witness import receipt, witness


def _json(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"expected a JSON object: {path}")
    return value


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="seam", description="Discover, verify and compile semantic boundary dependencies")
    commands = parser.add_subparsers(dest="command", required=True)
    discover_parser = commands.add_parser("discover", help="extract explainable repository candidates")
    discover_parser.add_argument("--workspace", type=Path, default=DEFAULT_WORKSPACE)
    discover_parser.add_argument("--workflow", default="customer-field-migration")
    discover_parser.add_argument("--output", type=Path, default=DEFAULT_CANDIDATES)
    verify_parser = commands.add_parser("verify", help="classify candidates against curated evidence")
    verify_parser.add_argument("--candidates", type=Path, default=DEFAULT_CANDIDATES)
    verify_parser.add_argument("--evidence", type=Path, default=DEFAULT_EVIDENCE)
    verify_parser.add_argument("--output", type=Path, default=DEFAULT_VERIFIED)
    compile_parser = commands.add_parser("compile", help="compile verified dependencies into gate schema")
    compile_parser.add_argument("--verified", type=Path, default=DEFAULT_VERIFIED)
    compile_parser.add_argument("--output", type=Path, default=DEFAULT_COMPILED)
    compile_parser.add_argument("--baseline", type=Path, default=ROOT / "runtime-contracts/customer-field-migration.json")
    inspect_parser = commands.add_parser("inspect", help="print a human-readable discovery and evidence report")
    inspect_parser.add_argument("--verified", type=Path, default=DEFAULT_VERIFIED)
    inspect_parser.add_argument("--evidence", type=Path, default=DEFAULT_EVIDENCE)
    manifest_parser = commands.add_parser("manifest", help="build a proof-carrying handoff manifest")
    manifest_parser.add_argument("--contract", type=Path, default=DEFAULT_COMPILED)
    manifest_parser.add_argument("--verified", type=Path, default=DEFAULT_VERIFIED)
    manifest_parser.add_argument("--output", type=Path, default=ROOT / ".semantic-boundary/generated/handoff-manifest.json")
    witness_parser = commands.add_parser("witness", help="run executable outcome checks for a valid manifest")
    witness_parser.add_argument("--contract", type=Path, default=DEFAULT_COMPILED)
    witness_parser.add_argument("--manifest", type=Path, default=ROOT / ".semantic-boundary/generated/handoff-manifest.json")
    witness_parser.add_argument("--output", type=Path, default=ROOT / ".semantic-boundary/witness/outcome-witness.json")
    args = parser.parse_args(argv)

    try:
        if args.command == "discover":
            if args.workflow != "customer-field-migration":
                raise ValueError("this deterministic provider currently supports customer-field-migration")
            result = discover(args.workspace)
            write_json(args.output, result)
            print(f"DISCOVERED {len(result['candidates'])} candidates → {args.output}")
        elif args.command == "verify":
            result = verify(_json(args.candidates), _json(args.evidence))
            write_json(args.output, result)
            print(f"VERIFIED {len(result['dependencies'])} dependencies → {args.output}")
            for item in result["dependencies"]:
                print(f"  {item['id']}: {item['status']}")
        elif args.command == "compile":
            contract, report = compile_contract(_json(args.verified), args.baseline)
            write_json(args.output, contract)
            compatible = semantically_compatible(contract, _json(args.baseline))
            print("COMPILED CONTRACT")
            for item in report:
                print(f"  {item['id']}\n  status: {item['status']}")
            print(f"\nGate compatibility: {'YES' if compatible else 'NO'}")
            print(f"Output: {args.output}")
            return 0 if compatible else 2
        elif args.command == "manifest":
            result = build_manifest(_json(args.contract), _json(args.verified))
            write_json(args.output, result)
            print(f"MANIFEST {result['contract_id']} sha256:{result['contract_sha256']} → {args.output}")
        elif args.command == "witness":
            result = witness(ROOT, _json(args.manifest), _json(args.contract))
            write_json(args.output, result)
            print(receipt(result))
            return 0 if result["handoff_integrity"] == result["outcome_integrity"] == "PASS" else 2
        else:
            print(inspect_report(_json(args.verified), _json(args.evidence)))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"seam {args.command}: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
