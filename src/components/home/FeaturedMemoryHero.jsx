import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import FeaturedMemoryField from "../../visualization/FeaturedMemoryField";
import FullscreenStage from "../visual/FullscreenStage";

export default function FeaturedMemoryHero({ featuredMemory, pulse, entity }) {
  const homeLegend = [
    {
      label: "Liquidity",
      value: "Flow Continuity",
      text: "Smooth motion represents coherent payment behavior and stable memory flow.",
    },
    {
      label: "Density",
      value: "Transaction Pressure",
      text: "Particle concentration represents activity intensity and operational load.",
    },
    {
      label: "Risk",
      value: "Distortion",
      text: "Fracture and turbulence reveal unstable or risk-sensitive behavior.",
    },
    {
      label: "Health",
      value: "Operational Glow",
      text: "A cleaner glow indicates stronger coherence and healthier system behavior.",
    },
  ];
  return (
   <section className="relative overflow-hidden pt-28">
      <div className="absolute inset-0 hero-atmosphere opacity-80" />

      <div className="page-padding relative z-10">
       <div className="mx-auto flex max-w-[1520px] flex-col gap-6 pb-20">
          {/* TOP INFORMATION */}
          <div className="grid gap-8 pt-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            >
              <p className="label">{featuredMemory.type}</p>

<h1 className="hero-title mt-7 max-w-4xl text-[clamp(3.2rem,6.6vw,7.2rem)]">
  Financial memory,
  <br />
  visualized.
</h1>



            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.12,
                duration: 0.9,
                ease: [0.76, 0, 0.24, 1],
              }}
              className="lg:pb-4"
            >
              <p className="max-w-2xl text-[0.98rem] leading-8 text-muted">
                {featuredMemory.summary}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {featuredMemory.metrics.map((metric) => (
                  <MetricPill
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* VISUAL STAGE */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.22,
              duration: 1.05,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="relative h-[clamp(520px,56vh,680px)] overflow-hidden rounded-[2.4rem] border border-white/10 bg-black glow-blue"
          >
           <FeaturedMemoryField pulse={pulse} entity={entity} />

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.1)_48%,rgba(3,4,6,0.78)_100%)]" />

            {/* STAGE TOP BAR */}
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/28 px-6 py-3 backdrop-blur-2xl">
              <div>
                <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
                  Today’s Memory
                </p>
                <h2 className="system-title mt-1 text-[clamp(1.55rem,2.5vw,2.6rem)]">
                  {featuredMemory.title}
                </h2>
              </div>

              <div className="hidden items-center gap-6 text-right md:flex">
                <StageInfo label="Source" value={featuredMemory.source} />
                <StageInfo label="State" value={featuredMemory.memoryState} />
                <StageInfo label="Score" value={featuredMemory.visualScore} />

                <FullscreenStage
                  title={featuredMemory.title}
                  subtitle={featuredMemory.thesis}
                  triggerLabel="Expand Memory"
                  legend={homeLegend}
                >
                  <FeaturedMemoryField pulse={pulse} entity={entity} />
                </FullscreenStage>
              </div>
            </div>

            {/* STAGE BOTTOM BAR */}
            <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/38 backdrop-blur-2xl">
              <div className="grid gap-px bg-white/10 md:grid-cols-[1fr_1fr_auto]">
                <div className="bg-black/42 p-5">
                  <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
                    Interpretation
                  </p>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-white/72">
                    {featuredMemory.thesis}
                  </p>
                </div>

                <div className="bg-black/42 p-5">
                  <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
                    Live State
                  </p>
                  <p className="mt-2 text-sm text-white/72">{pulse.mood}</p>
                </div>

                <div className="flex items-center gap-3 bg-black/42 p-4">
                  <HeroLink to="/btc" label="Open Live" />
                  <HeroLink to="/atlas" label="Atlas" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.028] p-4">
      <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function StageInfo({ label, value }) {
  return (
    <div>
      <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
        {label}
      </p>
      <p className="mt-1.5 text-sm text-white/78">{value}</p>
    </div>
  );
}

function HeroLink({ to, label }) {
  return (
    <Link
      to={to}
      className="pointer-events-auto group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 transition duration-500 hover:bg-white hover:text-black"
    >
      <span className="mono-font text-[0.5rem] uppercase tracking-[0.16em]">
        {label}
      </span>
      <ArrowUpRight
        size={14}
        className="transition duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </Link>
  );
}