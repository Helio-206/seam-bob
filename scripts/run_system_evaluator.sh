#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
RUNTIME_DIR=$(mktemp -d)

cp -a "$ROOT_DIR/demo-workspace" "$RUNTIME_DIR/repo"
cp -a "$ROOT_DIR/evaluator" "$RUNTIME_DIR/evaluator"
npm install --silent --prefix "$RUNTIME_DIR/repo"

(cd "$RUNTIME_DIR" && "$RUNTIME_DIR/repo/node_modules/.bin/tsx" "$RUNTIME_DIR/evaluator/rolling-compatibility.test.ts")
