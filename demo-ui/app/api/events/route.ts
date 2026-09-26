import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type SafeEvent = {
  timestamp?: string;
  tool?: string;
  decision?: "ALLOW" | "BLOCK";
  required_dependencies?: string[];
  observed_dependencies?: string[];
  missing_dependencies?: string[];
  evidence_reference?: string[];
};

export const dynamic = "force-dynamic";

export async function GET() {
  const response = (events: SafeEvent[]) => NextResponse.json(
    { mode: "live", events },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
  const configuredPath = process.env.SEMANTIC_BOUNDARY_EVENTS_PATH;
  const filePaths = configuredPath
    ? [configuredPath]
    : [
        path.join(process.cwd(), "data", "live-events.ndjson"),
        path.join(process.cwd(), "..", "demo-workspace", ".semantic-boundary", "events.ndjson"),
      ];

  for (const filePath of filePaths) {
    try {
      const contents = await readFile(filePath, "utf8");
      const events: SafeEvent[] = contents
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .map((event) => ({
          timestamp: event.timestamp,
          tool: event.tool,
          decision: event.decision,
          required_dependencies: event.required_dependencies,
          observed_dependencies: event.observed_dependencies,
          missing_dependencies: event.missing_dependencies,
          evidence_reference: event.evidence_reference,
        }));

      return response(events);
    } catch {
      continue;
    }
  }

  return response([]);
}
