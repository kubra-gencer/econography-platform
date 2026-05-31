import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { companies } from "../data/companies";
import EntityAura from "../visualization/EntityAura";
import FullscreenStage from "../components/visual/FullscreenStage";

export default function AtlasPage() {
  const [selectedId, setSelectedId] = useState(companies[0].id);

  const selectedCompany = useMemo(() => {
    return companies.find((company) => company.id === selectedId) || companies[0];
  }, [selectedId]);

  const selectedEntity = useMemo(() => {
    let mood = "stable";

    if (selectedCompany.riskPressure > 55) {
      mood = "volatile";
    } else if (selectedCompany.transactionDensity > 86) {
      mood = "dense";
    } else if (selectedCompany.liquidityCoherence > 84) {
      mood = "liquid";
    }

    return {
      mood,
      health: selectedCompany.paymentHealth,
      risk: selectedCompany.riskPressure,
      liquidity: selectedCompany.liquidityCoherence,
      volatility: selectedCompany.riskPressure,
      volume: selectedCompany.transactionDensity,
    };
  }, [selectedCompany]);

  const atlasLegend = useMemo(
    () => [
      {
        label: "Health",
        value: "Core Stability",
        text: "Operational health controls the clarity, glow and stability of the entity core.",
      },
      {
        label: "Liquidity",
        value: "Flow Smoothness",
        text: "Liquidity coherence creates smoother motion and more continuous aura rings.",
      },
      {
        label: "Density",
        value: "Aura Pressure",
        text: "Transaction density increases particle concentration around the financial fingerprint.",
      },
      {
        label: "Risk",
        value: "Fracture Signature",
        text: "Risk pressure appears as red distortion, unstable movement and fracture lines.",
      },
    ],
    []
  );

  return (
    <div className="relative overflow-hidden bg-[var(--bg)] pt-28 text-white">
      <div className="absolute inset-0 hero-atmosphere opacity-70" />

      <section className="page-padding relative z-10">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-6 pb-20">
          {/* TOP INFORMATION */}
          <div className="grid gap-8 pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            >
              <p className="label">Entity Archive</p>

              <h1 className="page-title mt-6 max-w-4xl text-[clamp(2.2rem,4.1vw,4.7rem)]">
                Financial entities translated into living memory.
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
                Each entity becomes a financial fingerprint. Payment behavior,
                liquidity rhythm, operational health and risk pressure are
                translated into a distinct visual memory profile.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Selected Entity"
                  value={selectedCompany.name}
                  meaning={selectedCompany.category}
                />

                <MetricCard
                  label="Memory Type"
                  value={selectedCompany.memoryType}
                  meaning={selectedCompany.mood}
                />

                <MetricCard
                  label="Liquidity"
                  value={`${selectedCompany.liquidityCoherence}%`}
                  meaning="Measures continuity and smoothness of the memory flow."
                />

                <MetricCard
                  label="Risk Pressure"
                  value={`${selectedCompany.riskPressure}%`}
                  meaning="Controls distortion, fracture and unstable behavior."
                />
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
            className="relative h-[clamp(620px,68vh,780px)] overflow-hidden rounded-[2.4rem] border border-white/10 bg-black glow-blue"
          >
            <EntityAura entity={selectedEntity} company={selectedCompany} />

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.04)_46%,rgba(3,4,6,0.72)_100%)]" />

            {/* STAGE TOP BAR */}
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/24 px-6 py-3 backdrop-blur-2xl">
              <div>
                <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
                  Financial Memory Profile
                </p>

                <h2 className="system-title mt-1 text-[clamp(1.45rem,2.3vw,2.35rem)]">
                  {selectedCompany.name}
                </h2>
              </div>

              <div className="hidden items-center gap-6 text-right md:flex">
                <StageInfo
                  label="Health"
                  value={`${selectedCompany.paymentHealth}%`}
                />
                <StageInfo
                  label="Density"
                  value={`${selectedCompany.transactionDensity}%`}
                />
                <StageInfo label="Score" value={selectedCompany.visualScore} />

                <FullscreenStage
                  title={selectedCompany.name}
                  subtitle={selectedCompany.description}
                  triggerLabel="Expand Memory"
                  legend={atlasLegend}
                >
                  <EntityAura entity={selectedEntity} company={selectedCompany} />
                </FullscreenStage>
              </div>
            </div>

            {/* STAGE BOTTOM BAR */}
            <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/34 backdrop-blur-2xl">
              <div className="grid gap-px bg-white/10 md:grid-cols-[1.2fr_1fr]">
                <div className="bg-black/42 p-4">
                  <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
                    Interpretation
                  </p>

                  <p className="mt-2 max-w-3xl text-sm leading-7 text-white/72">
                    {selectedCompany.description}
                  </p>
                </div>

                <div className="bg-black/42 p-4">
                  <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
                    Visual Traits
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCompany.visualTraits.map((trait) => (
                      <span
                        key={trait}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ENTITY SELECTOR */}
          <section className="pb-24 pt-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {companies.map((company) => (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => setSelectedId(company.id)}
                  className={`visual-card rounded-[1.6rem] p-5 text-left transition duration-500 hover:-translate-y-1 ${
                    selectedId === company.id
                      ? "border-white/25 bg-white/[0.06]"
                      : "border-white/10"
                  }`}
                >
                  <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
                    {company.category}
                  </p>

                  <h3 className="system-title mt-4 text-2xl">
                    {company.name}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-muted">
                    {company.rankReason}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs text-white/50">
                      {company.memoryType}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/72">
                      {company.visualScore}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, meaning }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.028] p-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
          {label}
        </p>

        <p className="text-sm font-medium text-white">{value}</p>
      </div>

      <p className="mt-3 text-xs leading-6 text-muted">{meaning}</p>
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