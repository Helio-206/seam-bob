"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ArrowRight,
  Check,
  CircleAlert,
  GitBranch,
  Play,
  Radio,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import evidence from "../data/verified-run.json";

gsap.registerPlugin(useGSAP);

type Phase = "blocked" | "repairing" | "allowed";
type Mode = "replay" | "live";

const timeline = [
  ["01", "Read context"],
  ["02", "Compile handoff"],
  ["03", "Boundary check"],
  ["04", "Repair"],
  ["05", "Verify 5/5"],
] as const;

function dependencyStatus(id: string, phase: Phase) {
  return id === "L" ? phase === "allowed" : true;
}
function StatusMark({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="status-mark status-mark--ok" aria-label="present">
      <Check size={13} strokeWidth={2.8} />
    </span>
  ) : (
    <span className="status-mark status-mark--missing" aria-label="missing">
      <X size={13} strokeWidth={2.8} />
    </span>
  );
}

export default function Home() {
  const rootRef = useRef<HTMLElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const repairRouteRef = useRef<HTMLDivElement>(null);
  const liveTokenRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const repairRef = useRef<HTMLDivElement>(null);
  const allowRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("replay");
  const [phase, setPhase] = useState<Phase>("blocked");
  const [isReplaying, setIsReplaying] = useState(false);
  const [liveMessage, setLiveMessage] = useState("Waiting for local boundary events…");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { contextSafe } = useGSAP(() => {
    gsap.set(routeRef.current, { scaleX: 1, transformOrigin: "left center" });
    gsap.set(repairRouteRef.current, { scaleX: 0, transformOrigin: "left center" });
    gsap.set(liveTokenRef.current, { y: 0 });
    gsap.set([blockRef.current, repairRef.current, allowRef.current], { autoAlpha: 0, y: 8 });
  }, { scope: rootRef });

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (mode !== "live") return;
    let active = true;
    const readEvents = async () => {
      try {
        const response = await fetch("/api/events", { cache: "no-store" });
        const payload = await response.json() as { events?: Array<{ decision?: string; missing_dependencies?: string[] }> };
        if (!active) return;
        const events = payload.events ?? [];
        const lastSpawn = [...events].reverse().find((event) => event.decision === "BLOCK" || event.decision === "ALLOW");
        if (!lastSpawn) {
          setLiveMessage("No spawn_subagent decision recorded yet.");
          return;
        }
        if (lastSpawn.decision === "BLOCK") {
          setPhase("blocked");
          setLiveMessage("Blocked · missing " + ((lastSpawn.missing_dependencies ?? []).join(", ") || "dependency"));
        } else {
          setPhase("allowed");
          setLiveMessage("Allowed · all required dependencies observed");
        }
      } catch {
        setLiveMessage("Live event source unavailable; replay remains available.");
      }
    };
    void readEvents();
    const interval = setInterval(() => void readEvents(), 2200);
    return () => { active = false; clearInterval(interval); };
  }, [mode]);

  const replay = contextSafe(() => {
    timers.current.forEach(clearTimeout);
    setIsReplaying(true);
    setPhase("blocked");
    gsap.killTweensOf([
      routeRef.current,
      repairRouteRef.current,
      liveTokenRef.current,
      blockRef.current,
      repairRef.current,
      allowRef.current,
    ]);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setPhase("allowed");
      setIsReplaying(false);
      return;
    }

    gsap.set(routeRef.current, { scaleX: 1 });
    gsap.set(repairRouteRef.current, { scaleX: 0 });
    gsap.set(liveTokenRef.current, { y: 0 });
    gsap.set([blockRef.current, repairRef.current, allowRef.current], { autoAlpha: 0, y: 8 });

    const sequence = gsap.timeline({ onComplete: () => setIsReplaying(false) });
    sequence
      .to(liveTokenRef.current, { y: 54, duration: 0.55, ease: "power2.inOut" }, 0.6)
      .to(blockRef.current, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 1.05)
      .call(() => setPhase("repairing"), [], 1.55)
      .to(liveTokenRef.current, { y: 0, duration: 0.65, ease: "back.out(1.6)" }, 1.72)
      .to(repairRef.current, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, 1.95)
      .to(repairRouteRef.current, { scaleX: 1, duration: 0.75, ease: "power2.inOut" }, 2.1)
      .call(() => setPhase("allowed"), [], 2.72)
      .to(allowRef.current, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, 2.75);
  });

  const currentStep = phase === "blocked" ? 2 : phase === "repairing" ? 3 : 4;
  const phaseTitle = phase === "blocked" ? "Handoff blocked" : phase === "repairing" ? "Bob repairs the handoff" : "Handoff allowed";
  const phaseBody = phase === "blocked"
    ? "C and R arrived. L did not survive the boundary."
    : phase === "repairing"
      ? "The guard returns a precise repair. Bob folds it into the retry."
      : "C, R and L are present. Downstream execution may proceed.";

  return (
    <main className="seam-app" ref={rootRef}>
      <header className="topbar">
        <a className="wordmark" href="#" aria-label="SEAM home"><span className="wordmark-seam">SEAM</span><span className="wordmark-rule" /> <span>semantic boundary guard</span></a>
        <div className="topbar-actions">
          <span className="verified-badge"><span /> recorded verified run</span>
          <div className="mode-switch" role="group" aria-label="Demo mode">
            {(["replay", "live"] as Mode[]).map((item) => (
              <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)}>
                {item === "replay" ? "Replay" : "Live"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-kicker"><span className="kicker-line" /> agent handoff / customer migration</div>
        <h1>Where requirements cross,<br /><em>safety is decided.</em></h1>
        <div className="hero-bottom">
          <p>Bob understood the system. The first handoff did not. SEAM checks whether the semantics required for downstream correctness survive delegation.</p>
          <button className="replay-cta" type="button" onClick={replay} disabled={isReplaying || mode === "live"}>
            <Play size={15} fill="currentColor" />
            {isReplaying ? "Replaying verified run" : "Replay verified run"}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="mission-strip" aria-label="Current task">
        <div><span className="strip-label">TASK</span><strong>{evidence.task}</strong></div>
        <div><span className="strip-label">CONTRACT</span><strong>C / R / L</strong></div>
        <div><span className="strip-label">MODE</span><strong>{mode === "replay" ? "Recorded evidence" : "Local events"}</strong></div>
      </section>

      <section className="flow-section" aria-label="Handoff flow">
        <div className="flow-heading">
          <div><span className="section-number">01</span><span>Follow the requirement</span></div>
          <span className="flow-caption">A live path through the boundary</span>
        </div>

        <div className="flow-map">
          <div className="flow-route" ref={routeRef} />
          <div className="flow-repair-route" ref={repairRouteRef} />
          <div className="flow-station flow-station--context">
            <div className="station-label">Context <span>01</span></div>
            <h2>What Bob knew</h2>
            <p>Three semantic dependencies existed before delegation.</p>
            <div className="dependency-row">
              {evidence.dependencies.map((dependency) => <span key={dependency.id} className="dependency-chip"><b>{dependency.id}</b> {dependency.name.replaceAll("_", " ")}</span>)}
            </div>
          </div>

          <div className="flow-station flow-station--boundary">
            <div className="station-label">Handoff <span>02</span></div>
            <h2>spawn_subagent</h2>
            <p>SEAM reads the actual description before execution.</p>
            <div className="boundary-check">
              {evidence.dependencies.map((dependency) => {
                const present = dependencyStatus(dependency.id, phase);
                return <div className={"boundary-token " + (present ? "boundary-token--ok" : "boundary-token--missing")} key={dependency.id}>
                  <span>{dependency.id}</span><StatusMark ok={present} />
                </div>;
              })}
            </div>
            <div className="live-token" ref={liveTokenRef}>L</div>
          </div>

          <div className="flow-station flow-station--result">
            <div className="station-label">Result <span>03</span></div>
            <h2>Downstream safety</h2>
            <div className="result-score"><span>before repair</span><strong>4/5</strong><small>L0 · repeat-01 / 02 / 03</small></div>
            <div className={"result-score result-score--after " + (phase === "allowed" ? "result-score--active" : "")}><span>after repair</span><strong>5/5</strong><small>L1 · repeat-01 / 02 / 03</small></div>
          </div>

          <div className="decision-stack">
            <div className="decision decision--block" ref={blockRef}><CircleAlert size={18} /><span><b>BLOCK</b> L is missing</span></div>
            <div className="decision decision--repair" ref={repairRef}><Wrench size={18} /><span><b>REPAIR</b> Bob retries</span></div>
            <div className="decision decision--allow" ref={allowRef}><ShieldCheck size={18} /><span><b>ALLOW</b> all semantics present</span></div>
          </div>
        </div>

        <div className="flow-status" aria-live="polite">
          <div className={"status-message status-message--" + phase}>
            {phase === "allowed" ? <ShieldCheck size={20} /> : phase === "repairing" ? <Wrench size={20} /> : <CircleAlert size={20} />}
            <div><strong>{phaseTitle}</strong><p>{phaseBody}</p></div>
            {phase === "blocked" && <div className="missing-status"><span>missing</span><b>LIVE_N_WRITE_COMPAT</b></div>}
          </div>
          {mode === "live" && <div className="live-status"><Radio size={14} /> {liveMessage}</div>}
        </div>
      </section>

      <section className="sequence-section">
        <div className="flow-heading"><div><span className="section-number">02</span><span>The handoff in motion</span></div><span className="flow-caption">Use Replay to see the boundary change state</span></div>
        <div className="sequence-track">
          {timeline.map(([number, label], index) => (
            <div className={"sequence-step " + (index <= currentStep ? "sequence-step--active" : "")} key={number}>
              <span className="sequence-node">{index < currentStep ? <Check size={13} /> : number}</span>
              <span>{label}</span>
              {index < timeline.length - 1 && <i className={index < currentStep ? "sequence-line--active" : ""} />}
            </div>
          ))}
        </div>
      </section>

      <section className="evidence-section">
        <div className="evidence-heading"><span className="section-number">03</span><h2>One sentence changed the outcome.</h2><p>The L0 and L1 delegation payloads were byte-for-byte identical except for the live-write compatibility requirement.</p></div>
        <div className="evidence-grid">
          <div className="evidence-card evidence-card--without"><span>without L</span><strong>4/5</strong><small>repeat-01 · repeat-02 · repeat-03</small></div>
          <div className="evidence-arrow"><ArrowRight size={22} /></div>
          <div className="evidence-card evidence-card--with"><span>with L</span><strong>5/5</strong><small>repeat-01 · repeat-02 · repeat-03</small></div>
          <div className="evidence-facts"><div><span>Normal tests</span><b>7/7</b></div><div><span>System evaluator</span><b>5/5</b></div><div><span>Valid boundary runs</span><b>6/6</b></div></div>
        </div>
      </section>

      <footer className="footer"><div><span className="footer-mark">S</span> SEAM</div><span>Deterministic contract · recorded evidence · no safety guarantee implied</span><span><GitBranch size={13} /> {evidence.evidence_status.replaceAll("_", " ")}</span></footer>
    </main>
  );
}
