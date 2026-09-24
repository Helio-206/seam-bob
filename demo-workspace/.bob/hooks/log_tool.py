import sys
import json
from pathlib import Path
from datetime import datetime, timezone

payload = json.load(sys.stdin)
payload["captured_at"] = datetime.now(timezone.utc).isoformat()

out = Path(".seam")
out.mkdir(exist_ok=True)

with (out / "tools.ndjson").open("a", encoding="utf-8") as f:
    f.write(json.dumps(payload) + "\n")
