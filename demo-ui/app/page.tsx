"use client";

import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleAlert,
  FileCheck2,
  Play,
  Radio,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import evidence from "../data/verified-run.json";

type Phase = "knows" | "blocked" | "repairing" | "allowed" | "results" | "evidence" | "closing";
type Mode = "judge" | "live";

const semanticCopy: Record<string, { plain: string; short: string }> = {
  C: { plain: "Old mobile clients still work", short: "previous client payload" },
  R: { plain: "Old and new versions coexist", short: "rolling version overlap" },
  L: { plain: "The old version still writes data", short: "live legacy writes" },
};

const demoSteps: Array<{ phase: Phase; caption: string; duration: number }> = [
  { phase: "knows", caption: "Bob starts with three critical rollout rules.", duration: 6000 },
  { phase: "blocked", caption: "Bob delegates the migration. One requirement fails to cross the handoff.", duration: 7000 },
  { phase: "blocked", caption: "SEAM blocks the real delegation before the subagent runs.", duration: 7000 },
  { phase: "repairing", caption: "Bob receives the missing requirement and repairs the handoff.", duration: 7000 },
  { phase: "allowed", caption: "Bob retries. All three requirements arrive; the handoff is allowed.", duration: 7000 },
  { phase: "results", caption: "The recorded implementation finishes: 8/8 normal tests and 5/5 system invariants.", duration: 7000 },
  { phase: "evidence", caption: "The old version still writes data. In three controlled runs, this requirement moved correctness from 4/5 to 5/5.", duration: 7000 },
  { phase: "closing", caption: "Coding agents review code. SEAM reviews what one agent tells another.", duration: 7000 },
];

const dependencyRows = evidence.dependencies.map((dependency) => ({
  ...dependency,
  plain: semanticCopy[dependency.id]?.plain ?? dependency.detail,
  short: semanticCopy[dependency.id]?.short ?? dependency.id,
}));
const lostId = evidence.replay.missing[0];

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? <span className="diff-icon diff-icon--ok" aria-label="present"><Check size={14} /></span>
    : <span className="diff-icon diff-icon--lost" aria-label="missing"><X size={14} /></span>;
}

function SemanticHandoffDiff({ phase }: { phase: Phase }) {
  const isBeforeSend = phase === "knows";
  const repaired = ["allowed", "results", "evidence", "closing"].includes(phase);
  const decision = phase === "blocked" ? "BLOCK" : repaired ? "ALLOW" : "WAITING";

  return (
    <section className="handoff-card" aria-label="Semantic handoff comparison">
      <div className="diff-head">
        <div><span>01 / SOURCE</span><h2>PARENT KNOWS</h2></div>
        <div className="diff-center-label">SEAM FIREWALL</div>
        <div><span>02 / RECEIVER</span><h2>SUBAGENT RECEIVES</h2></div>
      </div>
      <div className="diff-rows">
        {dependencyRows.map((item) => {
          const wasLost = item.name === lostId && !repaired && !isBeforeSend;
          const delivered = !isBeforeSend && !wasLost;
          return (
            <div className={"diff-row " + (wasLost ? "diff-row--lost" : "")} key={item.id}>
              <div className="diff-parent">
                <StatusIcon ok />
                <div><strong>{item.plain}</strong><small>{item.name}</small></div>
              </div>
              <div className="diff-crossing" aria-hidden="true"><span /><ArrowRight size={17} /></div>
              <div className={"diff-received " + (wasLost ? "diff-received--lost" : "")}>
                {isBeforeSend ? <span className="not-sent">not sent yet</span> : <><StatusIcon ok={delivered} /><strong>{wasLost ? "LOST IN HANDOFF" : "preserved"}</strong></>}
              </div>
            </div>
          );
        })}
      </div>
      <div className={"firewall-verdict firewall-verdict--" + decision.toLowerCase()}>
        <span className="firewall-mark">SEAM</span>
        <span className="firewall-line" />
        <span className="firewall-decision">{decision === "BLOCK" ? <><CircleAlert size={17} /> BLOCK · 1 critical requirement missing</> : decision === "ALLOW" ? <><ShieldCheck size={17} /> ALLOW · all critical semantics survived</> : <>Waiting for Bob to delegate</>}</span>
      </div>
      <div className="diff-totals" aria-live="polite">
        {isBeforeSend ? <><b>3 critical rules</b><span>Bob knows them before delegation</span></> : repaired
          ? <><b>3 / 3 survived → ALLOW</b><span>Bob repaired the handoff and retried</span></>
          : <><b>2 / 3 survived → BLOCK</b><span>The subagent would miss a release-critical requirement</span></>}
      </div>
    </section>
  );
}

function SemanticReceipt({ phase, mode }: { phase: Phase; mode: Mode }) {
  const allowed = ["allowed", "results", "evidence", "closing"].includes(phase);
  const visible = !["knows"].includes(phase);
  if (!visible) return null;
  const required = dependencyRows.map((item) => item.name);
  const missing = allowed ? [] : [lostId];
  const observed = required.filter((id) => !missing.includes(id));
  const receipt = {
    tool: "spawn_subagent",
    required_dependencies: required,
    observed_dependencies: observed,
    missing_dependencies: missing,
    decision: allowed ? "ALLOW" : "BLOCK",
  };

  return (
    <section className="receipt" aria-label="Semantic receipt generated from the recorded handoff">
      <div className="receipt-heading"><FileCheck2 size={16} /><strong>SEMANTIC RECEIPT</strong><span>{mode === "live" ? "local gate event" : "recorded Bob IDE handoff"}</span></div>
      <pre>{JSON.stringify(receipt, null, 2)}</pre>
    </section>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("judge");
  const [phase, setPhase] = useState<Phase>("blocked");
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [liveMessage, setLiveMessage] = useState("Waiting for local Bob boundary events…");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    if (mode !== "live") return;
    let active = true;
    const readEvents = async () => {
      try {
        const response = await fetch("/api/events", { cache: "no-store" });
        const payload = await response.json() as { events?: Array<{ decision?: string; missing_dependencies?: string[] }> };
        if (!active) return;
        const event = [...(payload.events ?? [])].reverse().find((item) => item.decision === "BLOCK" || item.decision === "ALLOW");
        if (!event) {
          setLiveMessage("No spawn_subagent decision recorded yet.");
          return;
        }
        setPhase(event.decision === "BLOCK" ? "blocked" : "allowed");
        setLiveMessage(event.decision === "BLOCK"
          ? `BLOCK · missing ${(event.missing_dependencies ?? []).join(", ") || "a required dependency"}`
          : "ALLOW · all required dependencies observed");
      } catch {
        setLiveMessage("Local event source unavailable; recorded Judge Demo remains available.");
      }
    };
    void readEvents();
    const interval = setInterval(() => void readEvents(), 2200);
    return () => { active = false; clearInterval(interval); };
  }, [mode]);

  const startJudgeDemo = () => {
    clearTimers();
    setMode("judge");
    setDemoStep(0);
    setPhase(demoSteps[0].phase);
    setIsReplaying(true);
    let elapsed = 0;
    demoSteps.forEach((step, index) => {
      elapsed += step.duration;
      const nextStep = index + 1;
      if (nextStep < demoSteps.length) {
        timers.current.push(setTimeout(() => {
          setDemoStep(nextStep);
          setPhase(demoSteps[nextStep].phase);
        }, elapsed));
      } else {
        timers.current.push(setTimeout(() => setIsReplaying(false), elapsed));
      }
    });
  };

  const activePhase = phase;
  const activeStep = demoStep === null ? null : demoSteps[demoStep];
  const without = evidence.controlled_evidence.without_live_n_write_compat;
  const withRequirement = evidence.controlled_evidence.with_live_n_write_compat;
  const stepProgress = demoStep === null ? 0 : ((demoStep + 1) / demoSteps.length) * 100;

  return (
    <main className="seam-app">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="SEAM home"><span className="wordmark-seam">SEAM</span><span className="wordmark-rule" /><span>semantic integrity layer</span></a>
        <div className="topbar-actions">
          <span className="bob-badge"><span className="bob-dot" /> IBM Bob IDE · recorded runtime</span>
          <button className="mode-button" type="button" onClick={() => {
            clearTimers();
            setIsReplaying(false);
            setDemoStep(null);
            if (mode === "live") {
              setMode("judge");
              setPhase("blocked");
            } else {
              setMode("live");
            }
          }} aria-pressed={mode === "live"}>{mode === "live" ? <Play size={14} /> : <Radio size={14} />} {mode === "live" ? "Recorded Judge Demo" : "Live Bob events"}</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="hero-kicker"><span /> AI-ASSISTED APPLICATION MAINTENANCE · RELEASE SAFETY</div>
          <h1>Bob knew the requirement.<br /><em>The handoff lost it.</em></h1>
          <p>SEAM catches requirements lost when AI coding agents delegate — before the next agent runs.</p>
          <div className="hero-category">Semantic Integrity Layer for Agentic Software</div>
        </div>
        <div className="hero-meta">
          <span>THE DEVELOPER TASK</span>
          <strong>{evidence.task}</strong>
          <small>Database change · rolling release · existing customer data</small>
        </div>
      </section>

      <section className="judge-section" id="judge-demo" aria-label="Recorded Judge Demo">
        <div className="judge-heading">
          <div><span className="eyebrow">THE HANDOFF, AT A GLANCE</span><h2>Three rules go in.<br /><em>Only two get through.</em></h2></div>
          <button className="judge-button" type="button" onClick={startJudgeDemo} disabled={isReplaying || mode === "live"}>
            {isReplaying ? <Wrench size={16} /> : <Play size={16} fill="currentColor" />}
            {isReplaying ? "Judge Demo running" : "Play 55-second Judge Demo"}
            <ArrowRight size={16} />
          </button>
        </div>
        <SemanticHandoffDiff phase={activePhase} />
        <div className="recovery-strip">
          <div className="recovery-state recovery-state--blocked"><span>FIRST BOB HANDOFF</span><strong>2 / 3 → BLOCK</strong><small>SEAM stops the subagent before it runs</small></div>
          <ArrowRight className="recovery-arrow" size={19} />
          <div className="recovery-middle"><Wrench size={17} /><span>Bob receives the feedback<br /><b>repairs and retries</b></span></div>
          <ArrowRight className="recovery-arrow" size={19} />
          <div className="recovery-state recovery-state--allowed"><span>REPAIRED HANDOFF</span><strong>3 / 3 → ALLOW</strong><small>Implementation continues</small></div>
        </div>
        {activeStep && (
          <div className="demo-progress" aria-live="polite">
            <div className="demo-progress-label"><span>RECORDED REPLAY · STEP {String(demoStep! + 1).padStart(2, "0")} / {demoSteps.length}</span><strong>{activeStep.caption}</strong></div>
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stepProgress)}><span style={{ width: `${stepProgress}%` }} /></div>
          </div>
        )}
        {mode === "live" && <div className="live-status"><Radio size={14} /> {liveMessage}</div>}
      </section>

      <section className="result-strip" aria-label="Recorded run results">
        <div className="result-lead"><span>RECORDED IBM BOB IDE RUN</span><strong>Block. Repair. Retry. Continue.</strong></div>
        <div><span>Normal tests</span><b>{evidence.verification.normal_tests}</b></div>
        <div><span>System invariants</span><b>{evidence.verification.system_evaluator}</b></div>
        <div><span>Verified retry</span><b>ALLOW</b></div>
      </section>

      <section className="consequence-section">
        <div className="section-intro"><span className="eyebrow">WHY THE MISSING RULE MATTERS</span><h2>Locally correct code.<br /><em>System-level failure.</em></h2></div>
        <div className="consequence-chain">
          <div><span className="chain-number">01</span><b>During rollout,</b><p>the old version is still running.</p></div>
          <ArrowDown size={18} />
          <div><span className="chain-number">02</span><b>It still writes the old customer-name field.</b><p><code>customer_name</code></p></div>
          <ArrowDown size={18} />
          <div><span className="chain-number">03</span><b>The new version looks for the new field.</b><p><code>full_name</code></p></div>
          <ArrowRight className="chain-result-arrow" size={20} />
          <div className="consequence-outcome"><CircleAlert size={19} /><b>New customer data can be missed.</b></div>
        </div>
      </section>

      <section className="how-section" id="how-seam-knows">
        <div className="section-intro section-intro--wide"><span className="eyebrow">SIMPLE FIRST · EVIDENCE SECOND</span><h2>How does SEAM know<br /><em>what matters?</em></h2></div>
        <div className="how-grid">
          <article className="how-card how-card--discover"><span className="how-step">01 · DISCOVER</span><h3>Repository facts</h3><p>Old and new versions overlap. The old version still writes legacy customer data.</p><small>rollout policy + frozen N writer</small></article>
          <ArrowRight className="how-arrow" size={18} />
          <article className="how-card how-card--derive"><span className="how-step">CANDIDATE</span><h3>Keep reading old writes</h3><p>The new version must continue to read data written by the old one.</p><small>source-linked reasoning</small></article>
          <ArrowRight className="how-arrow" size={18} />
          <article className="how-card how-card--prove"><span className="how-step">02 · PROVE</span><h3>Controlled comparison</h3><div className="mini-score"><span>WITHOUT</span><b>{without.join(" · ")}</b></div><div className="mini-score"><span>WITH</span><b>{withRequirement.join(" · ")}</b></div><strong className="proven-tag">PROVEN IN THIS WORKFLOW</strong></article>
          <ArrowRight className="how-arrow" size={18} />
          <article className="how-card how-card--compile"><span className="how-step">03 · COMPILE → ENFORCE</span><h3>Make the rule executable</h3><p>Compile the evidence-backed requirement into a boundary contract. Inspect Bob’s handoff before the subagent runs.</p><small>existing Bob gate · unchanged runtime</small></article>
        </div>
        <p className="evidence-qualifier">Discovery proposes what may matter. Counterfactual evidence determines what actually mattered.</p>
      </section>

      <section className="bob-section" id="why-bob">
        <div className="bob-copy"><span className="eyebrow">WHY IBM BOB? · BUILT ON THE BOB DELEGATION BOUNDARY</span><h2>Bob gives SEAM<br /><em>a real place to act.</em></h2><p>SEAM is built around the moment Bob delegates work to an isolated subagent. The subagent stays focused; SEAM checks that critical meaning survives the handoff.</p></div>
        <div className="bob-mechanism">
          <div className="bob-node"><span>IBM BOB</span><b>Agent mode</b><small>parent agent</small></div><ArrowDown size={18} />
          <div className="bob-node bob-node--tool"><span>REAL BOB TOOL</span><b>spawn_subagent</b><small>focused, isolated context</small></div><ArrowDown size={18} />
          <div className="bob-node bob-node--seam"><span>BEFORE EXECUTION</span><b>SEAM · PreToolUse</b><small>inspect the actual tool call</small></div>
          <div className="bob-choices"><span className="choice-block">BLOCK · return repair feedback</span><span className="choice-allow">ALLOW · subagent starts</span></div>
          <div className="bob-recovery"><Wrench size={15} /> Bob can repair the handoff and retry</div>
        </div>
        <div className="bob-facts"><div><b>Bob Agent mode</b><span>can delegate work to subagents</span></div><div><b>Isolated context</b><span>the parent explicitly passes what its subagent needs</span></div><div><b>PreToolUse lifecycle hook</b><span>SEAM can inspect and block before execution</span></div></div>
        <p className="sponsor-line">Bob provides the real agent-to-agent boundary. SEAM makes that boundary semantically verifiable.</p>
      </section>

      <section className="evidence-section" id="evidence">
        <div className="evidence-heading"><span className="eyebrow">CONTROLLED BOUNDARY ABLATION</span><h2>One requirement.<br /><em>One measured difference.</em></h2><p>The L0 and L1 payloads were identical except for the live-write compatibility requirement. All six boundary runs were valid.</p></div>
        <div className="evidence-grid">
          <div className="evidence-card evidence-card--without"><span>WITHOUT LIVE_N_WRITE_COMPAT</span><strong>4/5</strong><small>{without.length} controlled repeats · each 4/5</small></div>
          <div className="evidence-arrow"><ArrowRight size={22} /></div>
          <div className="evidence-card evidence-card--with"><span>WITH LIVE_N_WRITE_COMPAT</span><strong>5/5</strong><small>{withRequirement.length} controlled repeats · each 5/5</small></div>
          <div className="evidence-facts"><div><span>Valid boundary runs</span><b>{evidence.controlled_evidence.valid_runs}</b></div><div><span>Final normal tests</span><b>{evidence.verification.normal_tests}</b></div><div><span>Final system invariants</span><b>{evidence.verification.system_evaluator}</b></div></div>
        </div>
      </section>

      <section className="receipt-section">
        <div className="section-intro"><span className="eyebrow">AUDITABLE DECISION</span><h2>The handoff leaves<br /><em>a receipt.</em></h2><p>Built from the recorded gate fields: required, observed, missing, and decision.</p></div>
        <SemanticReceipt phase={activePhase} mode={mode} />
      </section>

      <section className="value-section">
        <span className="eyebrow">DEVELOPER WORKFLOW · RELEASE SAFETY</span>
        <h2>Prevent agent-caused rework<br />and release regressions.</h2>
        <p>Not generic AI safety: help teams maintain applications and ship schema changes without losing rollout constraints between agents.</p>
        <blockquote>“We are not trying to give agents infinite context. We make sure the right semantics survive finite context.”</blockquote>
      </section>

      <section className="objections-section">
        <span className="eyebrow">FOUR SHORT ANSWERS</span><h2>Why not just…?</h2>
        <div className="objection-grid">
          <article><h3>More context?</h3><p>More context does not guarantee the critical requirement survives delegation.</p></article>
          <article><h3>RAG?</h3><p>Retrieval finds information; SEAM verifies that required meaning crossed the handoff.</p></article>
          <article><h3>Testing?</h3><p>Tests detect failures after work is produced; SEAM can stop an incomplete delegation before the subagent executes.</p></article>
          <article><h3>A policy engine?</h3><p>A policy engine assumes the policy is known; SEAM connects candidate semantics to correctness evidence before enforcing them.</p></article>
        </div>
      </section>

      <details className="technical-details">
        <summary>Technical detail · real Bob evidence · source provenance</summary>
        <div className="technical-grid">
          <div><b>Actual tool boundary</b><code>spawn_subagent</code><small>Bob IDE · PreToolUse · before execution</small></div>
          <div><b>Runtime sequence</b><code>BLOCK → repair → ALLOW</code><small>evidence/bob-ide-runtime-events.json</small></div>
          <div><b>Enforcement contract</b><code>runtime-contracts/customer-field-migration.json</code><small>compiled outside Bob-visible workspace</small></div>
          <div><b>Bob IDE session evidence</b><code>bob_sessions/</code><small>original session screenshots preserved</small></div>
          <div><b>Discovery provenance</b><code>infra/rollout-policy.md + evaluator/frozen-vN/legacy-customer-service.ts</code><small>migration + current reader fallback complete the L derivation</small></div>
          <div><b>Recorded event evidence</b><code>evidence/runtime-demo-summary.md</code><small>BLOCK: C/R observed, L missing · ALLOW: C/R/L observed</small></div>
        </div>
      </details>

      <footer className="footer"><div><span className="footer-mark">S</span><strong>SEAM</strong><span>Semantic Integrity Layer for Agentic Software</span></div><span>In this controlled workflow · no universal safety claim</span></footer>
    </main>
  );
}
