#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"
echo "SEAM PROOF-CARRYING DELEGATION"
echo "LOCAL DETERMINISTIC PROTOCOL DEMO"
python3 scripts/seam.py discover >/dev/null
python3 scripts/seam.py verify >/dev/null
python3 scripts/seam.py compile >/dev/null
python3 scripts/seam.py manifest
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
printf '%s\n' 'Migrate customer name: customer_name to full_name during rolling deployment.' > "$TMP_DIR/missing.txt"
echo "PRE-EXECUTION: missing manifest → BLOCK"
if python3 scripts/semantic_boundary_gate.py --description-file "$TMP_DIR/missing.txt" --contract runtime-contracts/generated/customer-field-migration.json --events "$TMP_DIR/events" >/dev/null 2>&1; then exit 1; fi
python3 - "$TMP_DIR/valid.txt" <<'PY'
import json, sys
m = json.load(open('.semantic-boundary/generated/handoff-manifest.json'))
open(sys.argv[1], 'w').write('Migrate customer name: customer_name to full_name during rolling deployment.\n<SEAM_MANIFEST>\n' + json.dumps(m, sort_keys=True, separators=(',', ':')) + '\n</SEAM_MANIFEST>\n')
PY
python3 scripts/semantic_boundary_gate.py --description-file "$TMP_DIR/valid.txt" --contract runtime-contracts/generated/customer-field-migration.json --events "$TMP_DIR/events" >/dev/null
echo "PRE-EXECUTION: repaired manifest → ALLOW"
python3 scripts/seam.py witness
