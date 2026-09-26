#!/usr/bin/env bash
set -euo pipefail

python3 scripts/seam.py discover --workspace demo-workspace --workflow customer-field-migration
python3 scripts/seam.py verify --candidates .semantic-boundary/discovery/candidate-dependencies.json --evidence evidence/boundary-summary.json
python3 scripts/seam.py compile --verified .semantic-boundary/discovery/verified-dependencies.json --output runtime-contracts/generated/customer-field-migration.json
python3 scripts/seam.py inspect
