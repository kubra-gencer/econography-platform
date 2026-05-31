import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { featuredMemory } from "../data/featuredMemory";
import { companies } from "../data/companies";
import { generateFinancialPulse } from "../utils/generateFinancialPulse";

import FeaturedInterpretation from "../components/home/FeaturedInterpretation";
import MemoryLeaderboard from "../components/home/MemoryLeaderboard";

const visualGrammar = [
  {
    signal: "Price",
    form: "Trajectory",
    code: "01",
    description:
      "BTC price movement defines the main spatial path. The market is no longer read as a flat line, but as a trace moving through memory space.",
  },
  {
    signal: "Volume",
    form: "Density",
    code: "02",
    description:
      "Trading activity thickens the field. Higher volume creates heavier particles, stronger clusters and a more material sense of financial pressure.",
  },
  {
    signal: "Volatility",
    form: "Distortion",
    code: "03",
    description:
      "Unstable movement bends the visual field. Volatility becomes turbulence, deformation and spatial tension around the memory structure.",
  },
  {
    signal: "Risk",
    form: "Fracture",
    code: "04",
    description:
      "Market stress appears as rupture. Fracture marks show contraction, abnormal pressure and moments where the memory field becomes unstable.",
  },
  {
    signal: "Liquidity",
    form: "Flow",
    code: "05",
    description:
      "Liquidity produces continuity. Blue flow systems suggest circulation, smoother movement and the ability of the market to remain readable under pressure.",
  },
];

const systemPillars = [
  {
    label: "Conceptual Layer",
    title: "Financial memory, not market decoration",
    text:
      "Econography reads financial signals as behavioral traces: volatility, liquidity, pressure and risk become a language for interpreting market memory.",
  },
  {
    label: "Visual Layer",
    title: "A controlled grammar of form and atmosphere",
    text:
      "Every visual detail is assigned a role. Trajectory, density, flow, fracture and glow are used as readable components rather than aesthetic noise.",
  },
  {
    label: "Technical Layer",
    title: "A live interface that can expand beyond Bitcoin",
    text:
      "The same framework can later map ETH, indexes, macroeconomic data, payment flows or institutional signals into distinct memory systems.",
  },
];

export default function HomePage() {
  const [pulse, setPulse] = useState(generateFinancialPulse());
  const featuredEntity = useMemo(() => selectFeaturedEntity(companies), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(generateFinancialPulse());
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_18%,rgba(88,119,255,0.12),transparent_28%),radial-gradient(circle_at_78%_4%,rgba(240,199,106,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_42%)]" />

      <div className="relative z-10">
        <EconographyIntro
          featuredMemory={featuredMemory}
          pulse={pulse}
          entity={featuredEntity}
        />

        <HomeFrameworkSection />

        <FeaturedInterpretation interpretation={featuredMemory.interpretation} />

        <SystemIdentitySection />

        <MemoryLeaderboard companies={companies} />

        <HomeFinalCTA />
      </div>
    </div>
  );
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number / 100));
}

function readEntityNumber(entity, keys, fallback = 0) {
  for (const key of keys) {
    const value = entity?.[key];
    if (Number.isFinite(Number(value))) return Number(value);
  }

  return fallback;
}

function readEntityText(entity, keys, fallback = "Unknown Memory") {
  for (const key of keys) {
    const value = entity?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return fallback;
}

function buildEntityProfile(entity = {}) {
  const name = readEntityText(entity, ["name", "company", "title"], "Lunara Pay");
  const category = readEntityText(entity, ["category", "sector", "type"], "Payment Infrastructure");
  const state = readEntityText(entity, ["state", "memoryState", "mood"], "Liquid Harmony");
  const score = readEntityNumber(entity, ["score", "memory", "memoryScore"], 88);
  const health = readEntityNumber(entity, ["health", "operationalHealth"], 91);
  const risk = readEntityNumber(entity, ["risk", "riskPressure"], 18);
  const liquidity = readEntityNumber(entity, ["liquidity", "liquidityCoherence"], 92);
  const volume = readEntityNumber(entity, ["volume", "transactionDensity", "density"], 87);
  const momentum = readEntityNumber(entity, ["momentum", "dailyMomentum", "growth"], 64);
  const volatility = readEntityNumber(
    entity,
    ["volatility", "instability"],
    Math.max(12, 100 - health)
  );

  const visualUniqueness = Math.round(
    Math.min(100, Math.max(28, score * 0.44 + liquidity * 0.22 + volume * 0.18 + momentum * 0.16))
  );

  const memoryClarity = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        score * 0.35 + health * 0.22 + liquidity * 0.2 + volume * 0.12 + (100 - risk) * 0.11
      )
    )
  );

  return {
    ...entity,
    name,
    category,
    state,
    score,
    health,
    risk,
    liquidity,
    volume,
    momentum,
    volatility,
    visualUniqueness,
    memoryClarity,
  };
}

function calculateFeaturedScore(entity) {
  const profile = buildEntityProfile(entity);
  const riskBalance = 100 - Math.abs(profile.risk - 26);

  return (
    profile.memoryClarity * 0.34 +
    riskBalance * 0.18 +
    profile.momentum * 0.18 +
    profile.visualUniqueness * 0.16 +
    profile.liquidity * 0.14
  );
}

function selectFeaturedEntity(list = []) {
  if (!Array.isArray(list) || list.length === 0) {
    return buildEntityProfile({
      name: "Lunara Pay",
      category: "Payment Infrastructure",
      state: "Liquid Harmony",
      score: 94,
      health: 91,
      risk: 18,
      liquidity: 92,
      volume: 87,
      momentum: 76,
    });
  }

  const selected = [...list].sort((a, b) => calculateFeaturedScore(b) - calculateFeaturedScore(a))[0];
  return buildEntityProfile(selected);
}

function resolveInterpretationText(interpretation) {
  if (typeof interpretation === "string") return interpretation;
  if (typeof interpretation?.summary === "string") return interpretation.summary;
  if (typeof interpretation?.description === "string") return interpretation.description;
  if (typeof interpretation?.text === "string") return interpretation.text;

  return "";
}

function EconographyIntro({ featuredMemory, pulse, entity }) {
  const profile = buildEntityProfile(entity);
  const interpretationText = resolveInterpretationText(featuredMemory?.interpretation);
  const [expandedView, setExpandedView] = useState(null);

  return (
    <section className="relative px-5 pb-20 pt-24 md:px-8 lg:px-10 lg:pt-28">
      <div className="mx-auto max-w-[calc(100%-0rem)]">
        <div className="rounded-[2.8rem] border border-white/10 bg-[#06070a]/58 p-6 shadow-[0_42px_150px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
              className="relative max-w-5xl"
            >
              <p className="mono-font text-[0.58rem] uppercase tracking-[0.25em] text-dim">
                What is Econography?
              </p>

              <h1 className="mt-7 max-w-5xl font-['Inter_Tight',Inter,sans-serif] text-[clamp(3rem,6.4vw,6.85rem)] font-medium leading-[0.9] tracking-[-0.082em] text-white">
                Financial data becomes living visual memory.
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 1, ease: [0.76, 0, 0.24, 1] }}
              className="max-w-3xl lg:justify-self-end"
            >
              <p className="text-base leading-8 text-muted md:text-lg">
                Econography is a creative-tech system that translates market signals into
                visual structures. Price becomes trajectory, volume becomes density,
                liquidity becomes flow, volatility becomes distortion and risk becomes fracture.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <IntroSignal label="Finance" value="signals" />
                <IntroSignal label="Art" value="memory" />
                <IntroSignal label="Tech" value="live engine" />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
            className="mt-10 rounded-[2rem] border border-white/10 bg-black/24 p-5"
          >
            <p className="mono-font text-[0.52rem] uppercase tracking-[0.22em] text-dim">
              System Thesis
            </p>
            <p className="mt-4 max-w-5xl text-[1.2rem] leading-8 tracking-[-0.035em] text-white/74 md:text-[1.45rem] md:leading-9">
              The market is not only measured. It is remembered, distorted, compressed
              and re-formed as an artwork.
            </p>
          </motion.div>
        </div>

        <motion.div
          id="featured-visualizations"
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="mt-12"
        >
          <div className="mb-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="mono-font text-[0.58rem] uppercase tracking-[0.25em] text-dim">
                Featured Visualizations
              </p>
              <h2 className="mt-4 max-w-4xl font-['Inter_Tight',Inter,sans-serif] text-[clamp(2.25rem,4.5vw,4.8rem)] font-medium leading-[0.96] tracking-[-0.07em] text-white">
                Today’s memory, read as system and artwork.
              </h2>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-white/48">
              The highlighted entity is chosen by memory clarity, signal quality, daily
              momentum, risk balance and visual uniqueness — not by company size or brand popularity.
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <HomeMemoryOrganismPreview
              profile={profile}
              interpretationText={interpretationText}
              onExpand={() => setExpandedView("organism")}
            />

            <GenerativeMemoryArtwork
              profile={profile}
              pulse={pulse}
              onExpand={() => setExpandedView("art")}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="mt-6"
        >
          <FeaturedMemoryReadingCard profile={profile} interpretationText={interpretationText} />
        </motion.div>
      </div>

      <ExpandedHomeMemoryModal
        view={expandedView}
        profile={profile}
        pulse={pulse}
        interpretationText={interpretationText}
        onClose={() => setExpandedView(null)}
      />
    </section>
  );
}

function IntroSignal({ label, value }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.025] p-4">
      <p className="mono-font text-[0.46rem] uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium uppercase tracking-[0.12em] text-white/68">
        {value}
      </p>
    </div>
  );
}

function FeaturedMemoryReadingCard({ profile, interpretationText }) {
  return (
    <article className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#07080b]/76 p-5 shadow-[0_34px_120px_rgba(0,0,0,0.38)] backdrop-blur-2xl md:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(123,140,255,0.16),transparent_34%),radial-gradient(circle_at_90%_70%,rgba(240,199,106,0.12),transparent_32%)]" />
      <div className="relative z-10 grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
        <div>
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="mono-font text-[0.5rem] uppercase tracking-[0.22em] text-dim">
                Featured Memory Reading
              </p>
              <h2 className="mt-4 text-[clamp(1.7rem,2.5vw,2.8rem)] font-medium leading-none tracking-[-0.065em] text-white">
                {profile.name}
              </h2>
              <p className="mt-2 text-xs leading-5 text-white/42">{profile.category}</p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-3 text-center">
              <p className="mono-font text-[0.42rem] uppercase tracking-[0.16em] text-white/30">
                Score
              </p>
              <p className="mt-1 text-2xl font-medium tracking-[-0.05em] text-white">{profile.score}</p>
            </div>
          </div>

          <div id="selection-method" className="mt-5 border-t border-white/10 pt-4">
            <p className="mono-font text-[0.46rem] uppercase tracking-[0.18em] text-dim">
              Why this memory?
            </p>
            <p className="mt-2 text-xs leading-6 text-white/44">
              Featured entities are selected by memory clarity, signal quality, daily momentum,
              risk balance and visual uniqueness — not by market size or popularity alone.
            </p>
          </div>
        </div>

        <div>
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p className="mono-font text-[0.46rem] uppercase tracking-[0.18em] text-dim">
              Live State
            </p>
            <p className="mt-2 text-xl font-medium tracking-[-0.04em] text-white">{profile.state}</p>
            <p className="mt-3 text-sm leading-6 text-white/48">
              {interpretationText ||
                "This memory is selected because its signals remain coherent, visually readable and balanced across liquidity, risk and operational pressure."}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SignalStat label="Memory Clarity" value={profile.memoryClarity} />
            <SignalStat label="Liquidity" value={profile.liquidity} />
            <SignalStat label="Risk Pressure" value={profile.risk} invert />
            <SignalStat label="Visual Uniqueness" value={profile.visualUniqueness} />
          </div>
        </div>
      </div>
    </article>
  );
}

function SignalStat({ label, value, invert = false }) {
  const normalized = clamp01(value);
  const width = `${Math.round(normalized * 100)}%`;
  const barOpacity = invert ? 1 - normalized * 0.55 : 0.48 + normalized * 0.38;

  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="mono-font text-[0.42rem] uppercase tracking-[0.15em] text-white/30">
          {label}
        </p>
        <p className="text-sm font-medium text-white/78">{Math.round(value)}%</p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-white" style={{ width, opacity: barOpacity }} />
      </div>
    </div>
  );
}

function HomeMemoryOrganismPreview({ profile, interpretationText, onExpand }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    let frame;
    let time = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(3,4,6,0.95)";
      context.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.53;
      const liquidity = clamp01(profile.liquidity);
      const risk = clamp01(profile.risk);
      const volume = clamp01(profile.volume);
      const clarity = clamp01(profile.memoryClarity);
      const volatility = clamp01(profile.volatility);
      const radius = Math.min(width, height) * 0.28;

      const field = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.75);
      field.addColorStop(0, `rgba(46,195,247,${0.09 + liquidity * 0.12})`);
      field.addColorStop(0.42, `rgba(123,140,255,${0.05 + clarity * 0.1})`);
      field.addColorStop(0.74, `rgba(240,199,106,${0.04 + volume * 0.08})`);
      field.addColorStop(1, "rgba(3,4,6,0)");
      context.fillStyle = field;
      context.fillRect(0, 0, width, height);

      context.save();
      context.translate(cx, cy);
      context.globalCompositeOperation = "lighter";

      for (let ring = 0; ring < 7; ring += 1) {
        context.beginPath();
        context.strokeStyle = `rgba(255,255,255,${0.035 + clarity * 0.055})`;
        context.lineWidth = 0.8 * dpr;
        context.ellipse(
          0,
          0,
          radius * (1 + ring * 0.16),
          radius * (0.34 + ring * 0.055),
          time * 0.002 + ring * 0.28,
          0,
          Math.PI * 2
        );
        context.stroke();
      }

      const nodes = Math.floor(26 + volume * 34);
      for (let i = 0; i < nodes; i += 1) {
        const phase = i / nodes;
        const angle = phase * Math.PI * 2 + time * (0.003 + liquidity * 0.004);
        const wave = Math.sin(phase * Math.PI * 8 + time * 0.018);
        const orbitX = radius * (1.72 + liquidity * 0.22);
        const orbitY = radius * (0.42 + volatility * 0.22);
        const x = Math.cos(angle) * orbitX;
        const y = Math.sin(angle) * orbitY + wave * radius * volatility * 0.22;
        const isRiskNode = risk > 0.36 && i % 7 === 0;
        const size = (2.5 + volume * 5.5 + Math.abs(wave) * 2) * dpr;

        context.beginPath();
        context.fillStyle = isRiskNode
          ? `rgba(213,47,63,${0.34 + risk * 0.4})`
          : `rgba(46,195,247,${0.32 + liquidity * 0.45})`;
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      }

      for (let i = 0; i < 96; i += 1) {
        const phase = i / 96;
        const angle = phase * Math.PI * 2 * 3.4 + time * 0.0018;
        const localRadius = radius * (0.8 + phase * 1.85);
        const x = Math.cos(angle) * localRadius * (1.05 + liquidity * 0.24);
        const y = Math.sin(angle * 0.68) * localRadius * 0.62;
        const size = (0.5 + Math.sin(i * 4.7 + time * 0.02) * 0.45 + clarity) * dpr;

        context.beginPath();
        context.fillStyle = `rgba(230,242,255,${0.08 + clarity * 0.24})`;
        context.arc(x, y, Math.max(0.4, size), 0, Math.PI * 2);
        context.fill();
      }

      const coreGlow = context.createRadialGradient(0, 0, 0, 0, 0, radius * 0.52);
      coreGlow.addColorStop(0, `rgba(240,199,106,${0.42 + clarity * 0.25})`);
      coreGlow.addColorStop(0.38, `rgba(46,195,247,${0.16 + liquidity * 0.22})`);
      coreGlow.addColorStop(1, "rgba(240,199,106,0)");
      context.fillStyle = coreGlow;
      context.beginPath();
      context.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
      context.fill();

      context.globalCompositeOperation = "source-over";
      context.strokeStyle = `rgba(213,47,63,${risk * 0.16})`;
      context.lineWidth = 1.2 * dpr;
      for (let i = 0; i < 8; i += 1) {
        const angle = i * 0.78 + time * 0.003;
        context.beginPath();
        context.moveTo(Math.cos(angle) * radius * 1.35, Math.sin(angle) * radius * 0.55);
        context.lineTo(Math.cos(angle + 0.18) * radius * 1.72, Math.sin(angle + 0.18) * radius * 0.7);
        context.stroke();
      }

      context.restore();

      const vignette = context.createRadialGradient(cx, cy, Math.min(width, height) * 0.12, cx, cy, Math.max(width, height) * 0.72);
      vignette.addColorStop(0, "rgba(3,4,6,0)");
      vignette.addColorStop(1, "rgba(3,4,6,0.72)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      time += 1;
      frame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(frame);
  }, [profile]);

  return (
    <article className="relative min-h-[620px] overflow-hidden rounded-[2.65rem] border border-white/10 bg-[#050609]/86 shadow-[0_42px_150px_rgba(0,0,0,0.44)] backdrop-blur-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),transparent_18%,rgba(0,0,0,0.36))]" />

      <div className="relative z-10 flex min-h-[620px] flex-col justify-between p-5 md:p-7 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mono-font text-[0.52rem] uppercase tracking-[0.24em] text-white/38">
              Financial Memory Organism
            </p>
            <h2 className="mt-3 text-[clamp(2rem,4vw,4.6rem)] font-medium leading-none tracking-[-0.075em] text-white">
              {profile.name} as a living market structure.
            </h2>
          </div>

          <button
            type="button"
            onClick={onExpand}
            className="rounded-full border border-white/12 bg-black/28 px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/68 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
          >
            Expand Memory
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div className="rounded-[1.65rem] border border-white/10 bg-black/32 p-4 backdrop-blur-xl">
            <p className="mono-font text-[0.48rem] uppercase tracking-[0.2em] text-white/34">
              Visual Reading
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
              {interpretationText ||
                "The organism shows a financial entity as a readable memory field: density reveals activity, flow reveals liquidity, glow reveals coherence and fracture reveals risk pressure."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniSignal label="Clarity" value={profile.memoryClarity} />
            <MiniSignal label="Liquidity" value={profile.liquidity} />
            <MiniSignal label="Volume" value={profile.volume} />
            <MiniSignal label="Risk" value={profile.risk} />
          </div>
        </div>
      </div>
    </article>
  );
}

function GenerativeMemoryArtwork({ profile, pulse, onExpand, expanded = false }) {
  const canvasRef = useRef(null);
  const pulseVolatility = Number.isFinite(Number(pulse?.volatility)) ? Number(pulse.volatility) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    let animationFrame;
    let time = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(3,4,6,0.92)";
      context.fillRect(0, 0, width, height);

      const liquidity = clamp01(profile.liquidity);
      const risk = clamp01(profile.risk);
      const volume = clamp01(profile.volume);
      const momentum = clamp01(profile.momentum);
      const volatility = clamp01(profile.volatility || pulseVolatility || 24);
      const clarity = clamp01(profile.memoryClarity);
      const cx = width * 0.5;
      const cy = height * 0.52;
      const radius = Math.min(width, height) * (0.22 + liquidity * 0.08);

      const glow = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.65);
      glow.addColorStop(0, `rgba(46,195,247,${0.14 + liquidity * 0.15})`);
      glow.addColorStop(0.38, `rgba(240,199,106,${0.05 + clarity * 0.1})`);
      glow.addColorStop(0.72, `rgba(213,47,63,${0.03 + risk * 0.12})`);
      glow.addColorStop(1, "rgba(3,4,6,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.save();
      context.translate(cx, cy);
      context.globalCompositeOperation = "lighter";

      const ribbons = 42;
      for (let i = 0; i < ribbons; i += 1) {
        const phase = i / ribbons;
        const alpha = 0.035 + phase * 0.018 + liquidity * 0.035;
        const hueShift = risk > 0.45 ? "213,47,63" : phase > 0.62 ? "240,199,106" : "46,195,247";
        context.beginPath();
        context.strokeStyle = `rgba(${hueShift},${alpha})`;
        context.lineWidth = (0.5 + volume * 1.5) * dpr;

        for (let x = -width * 0.48; x <= width * 0.48; x += width / 80) {
          const waveA = Math.sin(x * 0.012 + time * (0.018 + momentum * 0.018) + phase * 9.2);
          const waveB = Math.cos(x * 0.006 - time * 0.014 + phase * 12.7);
          const y =
            Math.sin(phase * Math.PI * 2 + time * 0.01) * radius * 0.18 +
            waveA * radius * (0.18 + volatility * 0.26) +
            waveB * radius * 0.12 +
            (phase - 0.5) * radius * 1.1;

          if (x === -width * 0.48) context.moveTo(x, y);
          else context.lineTo(x, y);
        }

        context.stroke();
      }

      const particles = Math.floor(120 + volume * 180);
      for (let i = 0; i < particles; i += 1) {
        const phase = i / particles;
        const angle = phase * Math.PI * 2 * 5.1 + time * (0.002 + liquidity * 0.003);
        const noise = Math.sin(i * 12.989 + time * 0.018) * Math.cos(i * 4.71 + time * 0.012);
        const localRadius = radius * (0.55 + phase * 1.2 + noise * volatility * 0.26);
        const x = Math.cos(angle) * localRadius * (1.15 + liquidity * 0.3);
        const y = Math.sin(angle * 0.72) * localRadius * (0.72 + volatility * 0.18);
        const size = (0.55 + clarity * 1.8 + Math.abs(noise) * 1.6) * dpr;
        const isStress = risk > 0.42 && i % 9 === 0;

        context.beginPath();
        context.fillStyle = isStress
          ? `rgba(213,47,63,${0.2 + risk * 0.35})`
          : `rgba(210,244,255,${0.16 + liquidity * 0.42})`;
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      }

      context.globalCompositeOperation = "source-over";
      context.strokeStyle = `rgba(255,255,255,${0.08 + clarity * 0.12})`;
      context.lineWidth = 1 * dpr;
      for (let i = 0; i < 4; i += 1) {
        context.beginPath();
        context.ellipse(
          0,
          0,
          radius * (1.1 + i * 0.18),
          radius * (0.38 + i * 0.08),
          time * 0.002 + i * 0.35,
          0,
          Math.PI * 2
        );
        context.stroke();
      }

      context.restore();

      const vignette = context.createRadialGradient(
        cx,
        cy,
        Math.min(width, height) * 0.18,
        cx,
        cy,
        Math.max(width, height) * 0.72
      );
      vignette.addColorStop(0, "rgba(3,4,6,0)");
      vignette.addColorStop(1, "rgba(3,4,6,0.62)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);

      time += 1;
      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [profile, pulseVolatility]);

  return (
    <article className={`relative ${expanded ? "min-h-[calc(100vh-5rem)]" : "min-h-[620px]"} overflow-hidden rounded-[2.65rem] border border-white/10 bg-[#050609]/82 shadow-[0_34px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_22%,rgba(0,0,0,0.22))]" />

      <div className={`relative z-10 flex h-full ${expanded ? "min-h-[calc(100vh-5rem)]" : "min-h-[620px]"} flex-col justify-between p-5 md:p-6`}>
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="mono-font text-[0.5rem] uppercase tracking-[0.22em] text-white/36">
              Generative Memory Field
            </p>
            <h2 className="mt-3 text-[clamp(1.65rem,2.5vw,2.65rem)] font-medium leading-none tracking-[-0.06em] text-white">
              Artistic signal study
            </h2>
          </div>
          <button
            type="button"
            onClick={onExpand}
            className="rounded-full border border-white/10 bg-black/28 px-4 py-2.5 text-[0.52rem] font-semibold uppercase tracking-[0.16em] text-white/50 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
          >
            {expanded ? "Collapse" : "Expand Art"}
          </button>
        </div>

        <div className="rounded-[1.55rem] border border-white/10 bg-black/34 p-4 backdrop-blur-xl">
          <p className="text-sm leading-6 text-white/58">
            Generated from {profile.name}: liquidity shapes flow, volume controls density,
            risk creates fracture, and clarity defines the brightness of the memory field.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniSignal label="Liquidity" value={profile.liquidity} />
            <MiniSignal label="Volume" value={profile.volume} />
            <MiniSignal label="Risk" value={profile.risk} />
          </div>
        </div>
      </div>
    </article>
  );
}

function ExpandedHomeMemoryModal({ view, profile, pulse, interpretationText, onClose }) {
  if (!view) return null;

  const isOrganism = view === "organism";

  return (
    <div className="fixed inset-0 z-[80] bg-[#020305]/92 p-4 backdrop-blur-2xl md:p-6">
      <div className="relative h-full overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#050609] shadow-[0_60px_180px_rgba(0,0,0,0.65)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-30 rounded-full border border-white/12 bg-black/40 px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/68 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
        >
          Close
        </button>

        <div className="h-full overflow-y-auto p-5 md:p-8">
          {isOrganism ? (
            <HomeMemoryOrganismPreview
              profile={profile}
              interpretationText={interpretationText}
              onExpand={onClose}
            />
          ) : (
            <GenerativeMemoryArtwork profile={profile} pulse={pulse} onExpand={onClose} expanded />
          )}
        </div>
      </div>
    </div>
  );
}

function MiniSignal({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
      <p className="mono-font text-[0.4rem] uppercase tracking-[0.15em] text-white/30">{label}</p>
      <p className="mt-1 text-sm font-medium text-white/76">{Math.round(value)}%</p>
    </div>
  );
}

function HomeFrameworkSection() {
  return (
    <section className="relative mx-auto max-w-[calc(100%-3rem)] border-t border-white/10 py-24 md:max-w-[calc(100%-6rem)]">
      <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          className="max-w-4xl"
        >
          <p className="mono-font text-[0.58rem] uppercase tracking-[0.24em] text-dim">
            Econography Framework
          </p>
          <h2 className="mt-5 font-['Inter_Tight',Inter,sans-serif] text-[clamp(2.35rem,5.8vw,6.4rem)] font-medium leading-[0.93] tracking-[-0.078em] text-white">
            Market data, translated into visual memory.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ delay: 0.08, duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          className="max-w-xl"
        >
          <p className="text-base leading-8 text-muted md:text-lg">
            The system does not decorate finance. It assigns meaning to each visual
            layer so that market behavior can be read as structure, pressure, motion
            and atmosphere.
          </p>

          <div className="mt-7 rounded-[1.35rem] border border-white/10 bg-white/[0.025] p-4">
            <p className="mono-font text-[0.5rem] uppercase tracking-[0.2em] text-dim">
              Visual Grammar
            </p>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Each visual layer has a role: trajectory, density, distortion, fracture and flow
              form the readable grammar of financial memory.
            </p>
          </div>
        </motion.div>
      </div>

      <div id="visual-grammar" className="grid gap-3 lg:grid-cols-5">
        {visualGrammar.map((item, index) => (
          <motion.article
            key={item.signal}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{
              delay: index * 0.05,
              duration: 0.75,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="group relative min-h-[360px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.045]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-4">
              <p className="mono-font text-[0.5rem] uppercase tracking-[0.22em] text-dim">
                {item.signal}
              </p>
              <span className="mono-font text-[0.52rem] text-white/26">{item.code}</span>
            </div>

            <div className="mt-16">
              <p className="mono-font text-[0.5rem] uppercase tracking-[0.2em] text-white/28">
                becomes
              </p>
              <h3 className="mt-3 text-[clamp(1.85rem,2.35vw,2.65rem)] font-medium tracking-[-0.06em] text-white">
                {item.form}
              </h3>
            </div>

            <p className="mt-8 text-sm leading-7 text-white/48">{item.description}</p>

            <div className="absolute bottom-5 left-5 right-5 h-px bg-white/10" />
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function SystemIdentitySection() {
  return (
    <section className="relative mx-auto max-w-[calc(100%-3rem)] py-24 md:max-w-[calc(100%-6rem)]">
      <div className="overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#07080b]/74 shadow-[0_40px_140px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r lg:p-12"
          >
            <p className="mono-font text-[0.58rem] uppercase tracking-[0.24em] text-dim">
              Project Identity
            </p>
            <h2 className="mt-5 max-w-4xl font-['Inter_Tight',Inter,sans-serif] text-[clamp(2.3rem,4.6vw,5.4rem)] font-medium leading-[0.94] tracking-[-0.075em] text-white">
              A financial memory engine for art, research and live market interpretation.
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-muted md:text-lg">
              Econography connects an academic concept with an interactive visual system.
              Its first live case is Bitcoin, but the structure is designed to expand into
              broader market and economic signals.
            </p>
          </motion.div>

          <div className="grid divide-y divide-white/10">
            {systemPillars.map((pillar, index) => (
              <motion.article
                key={pillar.label}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{
                  delay: index * 0.06,
                  duration: 0.75,
                  ease: [0.76, 0, 0.24, 1],
                }}
                className="group p-7 transition duration-300 hover:bg-white/[0.035] md:p-10"
              >
                <div className="flex items-start justify-between gap-5">
                  <p className="mono-font text-[0.5rem] uppercase tracking-[0.22em] text-dim">
                    {pillar.label}
                  </p>
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/30 shadow-[0_0_18px_rgba(255,255,255,0.35)] transition group-hover:bg-white/70" />
                </div>
                <h3 className="mt-4 max-w-xl text-2xl font-medium tracking-[-0.052em] text-white md:text-3xl">
                  {pillar.title}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/48">{pillar.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeFinalCTA() {
  return (
    <section className="relative mx-auto max-w-[calc(100%-3rem)] pb-28 pt-10 md:max-w-[calc(100%-6rem)]">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        className="overflow-hidden rounded-[2.8rem] border border-white/10 bg-[radial-gradient(circle_at_18%_18%,rgba(46,195,247,0.12),transparent_30%),radial-gradient(circle_at_86%_40%,rgba(240,199,106,0.12),transparent_28%),rgba(255,255,255,0.025)] p-7 shadow-[0_50px_160px_rgba(0,0,0,0.42)] backdrop-blur-2xl md:p-10 lg:p-14"
      >
        <div className="max-w-4xl">
          <p className="mono-font text-[0.58rem] uppercase tracking-[0.24em] text-dim">
            Next Memory Engine
          </p>
          <h2 className="mt-5 font-['Inter_Tight',Inter,sans-serif] text-[clamp(2.4rem,6vw,6.8rem)] font-medium leading-[0.92] tracking-[-0.078em] text-white">
            Enter the live Bitcoin memory system.
          </h2>
          <p className="mt-7 max-w-2xl text-base leading-8 text-muted md:text-lg">
            The BTC Memory Orbit is the first working expression of the Econography
            framework: live market signals translated into orbit, density, fracture,
            flow and financial atmosphere.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="/btc"
            className="rounded-full border border-white/12 bg-white px-6 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-white/82"
          >
            Open BTC Memory Orbit
          </a>
          <a
            href="/research"
            className="rounded-full border border-white/12 bg-black/20 px-6 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:border-white/22 hover:bg-white/[0.06] hover:text-white"
          >
            Research direction
          </a>
        </div>
      </motion.div>
    </section>
  );
}