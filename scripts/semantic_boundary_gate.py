#!/usr/bin/env python3
"""Run the release gate against a description file or the Bob hook protocol."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HOOK = ROOT / "demo-workspace" / ".bob" / "hooks" / "semantic_boundary_gate.py"
EVENTS = ROOT / "demo-workspace" / ".semantic-boundary" / "events.ndjson"


def main(argv: list[str] | None = None) -> int:
    args = list(argv if argv is not None else sys.argv[1:])
    if "--events" not in args:
        args.extend(["--events", str(EVENTS)])
    completed = subprocess.run([sys.executable, str(HOOK), *args])
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
