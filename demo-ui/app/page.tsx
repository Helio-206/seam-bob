"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Check,
  CircleAlert,
  FileCode2,
  GitBranch,
  Play,
  Radio,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import evidence from "../data/verified-run.json";

type Phase = "blocked" | "repairing" | "allowed";
type Mode = "replay" | "live";

const timeline = ["READ CONTEXT", "COMPILE HANDOFF", "PRETOOLUSE", "BLOCK", "REPAIR", "RETRY", "ALLOW", "IMPLEMENT", "VERIFY 5/5"];

function dependencyStatus(id: string, phase: Phase) {
  return id === "L" ? phase === "allowed" : true;
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-signal/15 text-signal"><Check size={14} strokeWidth={2.5} /></span>
  ) : (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-danger/15 text-danger"><X size={14} strokeWidth={2.5} /></span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mono mb-4 text-[10px] font-semibold tracking-[.22em] text-slate-500">{children}</div>;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("replay");
  const [phase, setPhase] = useState<Phase>("blocked");
  const [isReplaying, setIsReplaying] = useState(false);
  const [liveMessage, setLiveMessage] = useState("Waiting for local boundary events…");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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
          setLiveMessage(`Blocked · missing ${(lastSpawn.missing_dependencies ?? []).join(", ") || "dependency"}`);
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

  const replay = () => {
    timers.current.forEach(clearTimeout);
    setIsReplaying(true);
    setPhase("blocked");
    timers.current = [
      setTimeout(() => setPhase("repairing"), 1450),
      setTimeout(() => setPhase("allowed"), 2750),
      setTimeout(() => setIsReplaying(false), 3700),
    ];
  };

  const currentStep = phase === "blocked" ? 3 : phase === "repairing" ? 4 : 6;
  const phaseTitle = phase === "blocked" ? "SEMANTIC BOUNDARY BLOCKED" : phase === "repairing" ? "BOB REPAIRED DELEGATION" : "DELEGATION ALLOWED";
  const phaseBody = phase === "blocked" ? "The handoff reached C and R. L did not survive the boundary." : phase === "repairing" ? "Exact remediation feedback is now being folded into the retry." : "C, R, and L are present. Downstream execution may proceed.";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="seam-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between border-b hairline pb-5">
          <div className="flex items-center gap-4">
            <div className="relative flex h-10 w-10 items-center justify-center border border-cyan/40 text-cyan">
              <span className="absolute inset-x-2 top-1/2 h-px bg-cyan/80" />
              <span className="mono relative text-[11px] font-bold">S</span>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[.18em]">SEAM</div>
              <div className="mono mt-0.5 text-[10px] tracking-[.12em] text-slate-500">SEMANTIC BOUNDARY GUARD FOR AGENT HANDOFFS</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 border border-signal/25 bg-signal/5 px-3 py-2 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_10px_#b8f36b]" />
              <span className="mono text-[10px] tracking-[.14em] text-signal">VERIFIED RUN</span>
            </div>
            <div className="flex border hairline bg-white/[.02] p-1">
              {(["replay", "live"] as Mode[]).map((item) => (
                <button key={item} onClick={() => setMode(item)} className={`mono px-3 py-2 text-[10px] tracking-[.14em] transition ${mode === item ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                  {item === "replay" ? "REPLAY" : "LIVE"}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="pb-8 pt-12 lg:pb-12 lg:pt-16">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-4xl">
              <div className="mono mb-4 flex items-center gap-2 text-[11px] tracking-[.16em] text-cyan"><span className="h-px w-7 bg-cyan" /> AGENT HANDOFF / CUSTOMER MIGRATION</div>
              <h1 className="max-w-4xl text-3xl font-medium leading-[1.08] tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">Rename <span className="text-slate-500">customerName</span> <span className="text-cyan">→</span> fullName safely during a rolling deployment.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">Bob understood the system. The first handoff did not. SEAM checks whether the semantics required for downstream correctness survive delegation.</p>
            </div>
            <button onClick={replay} disabled={isReplaying || mode === "live"} className="group flex shrink-0 items-center justify-center gap-3 border border-cyan/50 bg-cyan/10 px-5 py-3 text-sm text-cyan transition hover:bg-cyan/15 disabled:cursor-not-allowed disabled:opacity-50">
              <Play size={15} fill="currentColor" />
              {isReplaying ? "REPLAYING VERIFIED RUN" : "Replay verified run"}
              <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        <section className="grid gap-px border border-white/[.08] bg-white/[.08] lg:grid-cols-[1fr_1.1fr_1fr]">
          <div className="bg-panel/95 p-6 lg:p-7">
            <SectionLabel>SOURCE CONTEXT</SectionLabel>
            <div className="space-y-4">
              {evidence.dependencies.map((dependency) => {
                const active = dependencyStatus(dependency.id, phase);
                return <div key={dependency.id} className={`border p-4 transition ${dependency.id === "L" && !active ? "border-danger/30 bg-danger/[.035]" : "border-white/[.08] bg-white/[.018]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3"><span className={`mono mt-0.5 text-sm font-semibold ${dependency.id === "L" && !active ? "text-danger" : "text-cyan"}`}>{dependency.id}</span><div><div className="mono text-[10px] font-semibold tracking-[.08em] text-slate-300">{dependency.name}</div><p className="mt-2 text-xs leading-5 text-slate-500">{dependency.detail}</p></div></div>
                    <StatusDot ok={active} />
                  </div>
                </div>;
              })}
            </div>
            <div className="mt-7 flex items-center gap-3 text-xs text-slate-500"><FileCode2 size={15} className="text-slate-600" /> compiled contract · deterministic marker groups</div>
          </div>

          <div className="scanline relative bg-[#0c1118] p-6 lg:p-7">
            <div className="absolute right-5 top-5 flex items-center gap-2 text-[10px] text-slate-600"><Terminal size={13} /> PRETOOLUSE</div>
            <SectionLabel>BOUNDARY CHECK</SectionLabel>
            <div className="mono mb-6 flex items-center gap-3 text-sm text-slate-300"><span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_12px_#8be9fd]" /> spawn_subagent <span className="text-slate-700">/</span> description</div>
            <div className="mb-7 grid grid-cols-3 gap-2">
              {evidence.dependencies.map((dependency) => <div key={dependency.id} className={`flex items-center justify-between border px-3 py-3 ${dependencyStatus(dependency.id, phase) ? "border-signal/25 bg-signal/[.04]" : "border-danger/30 bg-danger/[.05]"}`}><span className="mono text-xs text-slate-400">{dependency.id}</span><StatusDot ok={dependencyStatus(dependency.id, phase)} /></div>)}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .25 }} className={`border p-5 ${phase === "allowed" ? "border-signal/40 bg-signal/[.07] shadow-signal" : "border-danger/40 bg-danger/[.07] shadow-danger"}`}>
                <div className="flex items-start gap-3">
                  {phase === "allowed" ? <ShieldCheck className="mt-0.5 text-signal" size={20} /> : phase === "repairing" ? <Activity className="mt-0.5 animate-pulse text-cyan" size={20} /> : <CircleAlert className="mt-0.5 text-danger" size={20} />}
                  <div><div className={`mono text-sm font-semibold tracking-[.08em] ${phase === "allowed" ? "text-signal" : phase === "repairing" ? "text-cyan" : "text-danger"}`}>{phaseTitle}</div><p className="mt-2 text-xs leading-5 text-slate-400">{phaseBody}</p></div>
                </div>
                {phase === "blocked" && <div className="mt-5 border-t border-danger/20 pt-4"><div className="mono text-[10px] tracking-[.14em] text-slate-500">MISSING</div><div className="mono mt-2 flex items-center gap-2 text-xs text-danger"><X size={13} /> LIVE_N_WRITE_COMPAT</div><p className="mt-3 text-xs leading-5 text-slate-500">Version N may continue writing customer_name after migration. N+1 must still read those live legacy writes.</p></div>}
                {phase === "allowed" && <div className="mt-5 border-t border-signal/20 pt-4 mono text-[10px] tracking-[.14em] text-signal">ALL REQUIRED DEPENDENCIES OBSERVED</div>}
              </motion.div>
            </AnimatePresence>
            {mode === "live" && <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500"><Radio size={13} className="text-cyan" /> {liveMessage}</div>}
          </div>

          <div className="bg-panel/95 p-6 lg:p-7">
            <SectionLabel>DOWNSTREAM RESULT</SectionLabel>
            <div className="space-y-3">
              <div className="border border-white/[.08] bg-white/[.018] p-5"><div className="mono text-[10px] tracking-[.14em] text-slate-500">BEFORE REPAIR</div><div className="mt-3 flex items-end justify-between"><span className="text-4xl font-medium tracking-[-.06em] text-danger">4 / 5</span><span className="mono text-[10px] text-slate-600">L0 · ×3</span></div><div className="mt-3 h-1 bg-white/[.08]"><motion.div animate={{ width: phase === "allowed" ? "80%" : "80%" }} className="h-full bg-danger" /></div></div>
              <div className={`border p-5 transition ${phase === "allowed" ? "border-signal/30 bg-signal/[.04]" : "border-white/[.08] bg-white/[.018]"}`}><div className="mono text-[10px] tracking-[.14em] text-slate-500">AFTER REPAIR</div><div className={`mt-3 text-4xl font-medium tracking-[-.06em] ${phase === "allowed" ? "text-signal" : "text-slate-600"}`}>5 / 5</div><div className="mt-3 h-1 bg-white/[.08]"><motion.div animate={{ width: phase === "allowed" ? "100%" : "0%" }} transition={{ duration: .5 }} className="h-full bg-signal" /></div></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3"><div className="border border-white/[.08] p-4"><div className="mono text-[10px] text-slate-500">NORMAL TESTS</div><div className="mt-2 text-2xl font-medium text-white">7 / 7</div></div><div className="border border-white/[.08] p-4"><div className="mono text-[10px] text-slate-500">SYSTEM EVALUATOR</div><div className={`mt-2 text-2xl font-medium ${phase === "allowed" ? "text-signal" : "text-slate-600"}`}>5 / 5</div></div></div>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500"><GitBranch size={14} /> downstream implementation safety</div>
          </div>
        </section>

        <section className="border-x border-b border-white/[.08] bg-white/[.012] px-6 py-5 lg:px-7">
          <div className="mb-4 flex items-center justify-between"><SectionLabel>EXECUTION TIMELINE</SectionLabel><span className="mono text-[10px] text-slate-600">{mode === "replay" ? "RECORDED VERIFIED EVIDENCE" : "LOCAL EVENT STREAM"}</span></div>
          <div className="flex gap-0 overflow-x-auto pb-1">
            {timeline.map((step, index) => <div key={step} className="flex min-w-[105px] flex-1 items-center last:min-w-0"><div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] transition ${index <= currentStep ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-white/10 text-slate-700"}`}>{index < currentStep ? <Check size={12} /> : index + 1}</div><div className="ml-2 mr-3"><div className={`mono whitespace-nowrap text-[9px] tracking-[.08em] ${index <= currentStep ? "text-slate-300" : "text-slate-700"}`}>{step}</div></div>{index < timeline.length - 1 && <div className={`h-px flex-1 ${index < currentStep ? "bg-cyan/40" : "bg-white/10"}`} />}</div>)}
          </div>
        </section>

        <section className="grid gap-10 py-12 lg:grid-cols-[1.25fr_.75fr] lg:py-16">
          <div><SectionLabel>CONTROLLED EVIDENCE</SectionLabel><h2 className="max-w-xl text-2xl font-medium tracking-[-.03em] text-white sm:text-3xl">One sentence at the boundary. One invariant recovered downstream.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">The delegation payloads were identical except for one semantic dependency. In this controlled workflow, adding L consistently changed downstream system correctness from 4/5 to 5/5.</p></div>
          <div className="grid grid-cols-2 gap-3"><div className="border border-danger/20 bg-danger/[.025] p-5"><div className="mono text-[10px] tracking-[.12em] text-danger">WITHOUT L</div>{["repeat-01", "repeat-02", "repeat-03"].map((run) => <div key={run} className="mt-3 flex justify-between border-b border-white/[.06] pb-2 text-xs text-slate-400"><span>{run}</span><span className="mono text-danger">4/5</span></div>)}</div><div className="border border-signal/20 bg-signal/[.025] p-5"><div className="mono text-[10px] tracking-[.12em] text-signal">WITH L</div>{["repeat-01", "repeat-02", "repeat-03"].map((run) => <div key={run} className="mt-3 flex justify-between border-b border-white/[.06] pb-2 text-xs text-slate-400"><span>{run}</span><span className="mono text-signal">5/5</span></div>)}</div></div>
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t hairline py-6 text-[11px] text-slate-600 sm:flex-row"><span className="mono">SEAM / VERIFIED BOUNDARY REPLAY / 2026</span><span>Deterministic contract. Recorded evidence. No safety guarantee implied.</span></footer>
      </div>
    </main>
  );
}
