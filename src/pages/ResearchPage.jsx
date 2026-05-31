import { motion } from "framer-motion";

const pageGuide = [
  { id: "01", label: "Thesis", text: "Why market data can be read as memory." },
  { id: "02", label: "System", text: "How BTC data becomes a visual organism." },
  { id: "03", label: "Mapping", text: "Which signal controls which visual behavior." },
  { id: "04", label: "Truth", text: "What is live, what is interpreted." },
  { id: "05", label: "Roadmap", text: "What needs to become stronger next." },
];

const thesisPoints = [
  {
    title: "Markets leave traces.",
    text:
      "A market is not only a price line. It carries pressure, hesitation, confidence, panic, liquidity and collective behavior. Econography reads those traces as visual memory.",
  },
  {
    title: "The chart becomes a body.",
    text:
      "BTC signals are translated into a living structure. Price anchors the organism, volume thickens it, liquidity keeps it flowing, volatility distorts it and risk leaves scars.",
  },
  {
    title: "The artwork has to be readable.",
    text:
      "The goal is not to make a beautiful random image. Every glow, color, scar, orbit and distortion should be connected to a market condition.",
  },
];

const systemFlow = [
  { step: "Input", title: "BTC market data", text: "Price, change, volume, update time and range history enter the system." },
  { step: "Normalize", title: "Signals become values", text: "Raw values are converted into bounded signals such as risk, liquidity, volatility and density." },
  { step: "Map", title: "Values become behavior", text: "Each signal controls a visual behavior: glow, orbit, density, turbulence, scars or flow." },
  { step: "Render", title: "Behavior becomes memory", text: "The final output becomes a BTC organism or a curated market-state artwork." },
];

const signalMapping = [
  { signal: "Price", visual: "Orbit anchor", color: "#DCE4EF", text: "Sets the current financial reference point of the memory field." },
  { signal: "24h Change", visual: "Mood shift", color: "#D8CCFF", text: "Pushes the organism toward balance, stress, expansion or fracture." },
  { signal: "Volume", visual: "Density", color: "#FFD36A", text: "Adds weight, particle concentration and participation pressure." },
  { signal: "Volatility", visual: "Distortion", color: "#FF8A2A", text: "Bends the field and makes movement less stable." },
  { signal: "Liquidity", visual: "Flow", color: "#50E7FF", text: "Keeps the organism smooth, continuous and breathable." },
  { signal: "Risk", visual: "Scars", color: "#FF3D6E", text: "Creates red pressure, darker tissue and visible damage." },
];

const transparency = [
  {
    title: "Live range mode",
    tag: "data-driven",
    text:
      "When available, the BTC page uses public historical market data for 1D, 7D and 30D ranges. If the request fails or the provider is rate-limited, fallback simulation is shown clearly.",
  },
  {
    title: "Selected date markers",
    tag: "historical first",
    text:
      "Dates such as Apr 7, Jul 10 and Feb 5 are quick-access market states. The system first tries to fetch historical BTC price and volume data for the selected UTC day. If the request fails, the interface avoids showing a synthetic BTC price and clearly labels the state as unavailable or visual scaffold.",
  },
  {
    title: "Selected date price",
    tag: "12:00 UTC reference",
    text:
      "For selected dates, the displayed reference price is taken from the historical point closest to 12:00 UTC on that date. This keeps random date inspection consistent and avoids mixing a selected historical day with the current BTC price.",
  },
  {
    title: "Visual interpretation",
    tag: "mapped layer",
    text:
      "The numerical market data is public and data-driven when available. The organism itself is an interpretation layer: orbit, glow, density, scars and flow are visual mappings, not raw market indicators or investment signals.",
  },
  {
    title: "Art Space",
    tag: "curated artwork",
    text:
      "The artworks are curated visual interpretations of market states. They are not investment advice, trading signals or predictions.",
  },
];

const siteLayers = [
  {
    title: "BTC Memory Organism",
    text:
      "The analytical body of the site. It lets users inspect price, volume, volatility, liquidity and risk as visual behavior instead of reading only numbers.",
  },
  {
    title: "Art Space",
    text:
      "The gallery layer. It shows selected market states as higher-impact generative artworks so visitors can compare how different conditions create different bodies.",
  },
  {
    title: "Research",
    text:
      "The explanation layer. It tells visitors what the project tests, what is live, what is interpreted and how the visual language works.",
  },
];

const roadmap = [
  "Strengthen selected-date fetching with verified UTC windows and source labels.",
  "Add a small public data-source panel that shows API loaded, loading, unavailable or rate-limit status.",
  "Generate exportable artwork snapshots from real market states.",
  "Add richer data such as order-book depth, liquidation flow, ETF flow or macro indicators.",
  "Document the method with reproducible pipeline notes and stronger references.",
  "Clarify timezone assumptions, especially UTC versus local time, for selected historical dates.",
];

export default function ResearchPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--bg)] pt-28 text-white">
      <div className="absolute inset-0 hero-atmosphere opacity-70" />
      <div className="pointer-events-none absolute inset-0 hidden opacity-[0.16] [background-image:linear-gradient(rgba(80,231,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px] md:block" />
      <div className="pointer-events-none absolute left-[-18%] top-[18%] hidden h-[780px] w-[780px] rounded-full border border-cyan-200/10 opacity-40 blur-[1px] md:block" />
      <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[360px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-300/8 blur-[90px] md:top-[-180px] md:h-[720px] md:w-[980px] md:bg-cyan-300/10 md:blur-[170px]" />
      <div className="pointer-events-none absolute right-[-16%] top-[30%] hidden h-[560px] w-[560px] rounded-full bg-fuchsia-500/9 blur-[160px] md:block" />
      <div className="pointer-events-none absolute bottom-[8%] left-[-14%] hidden h-[520px] w-[520px] rounded-full bg-amber-300/6 blur-[150px] md:block" />

      <section className="page-padding relative z-10">
        <div className="mx-auto max-w-[1420px] pb-20">
          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            >
              <p className="label">Research / Econography System</p>
              <h1 className="mt-5 max-w-4xl font-['Inter_Tight',Inter,sans-serif] text-[clamp(2.2rem,4.35vw,5.4rem)] font-medium leading-[0.98] tracking-[-0.058em]">
                A research interface for visual market memory.
              </h1>
              <p className="mt-5 max-w-xl text-[0.92rem] leading-7 text-muted">
                Econography treats financial data as artistic material. This website tests how public BTC market data can become a live organism, a visual language and a curated art space while staying clear about what is data-driven and what is interpreted.
              </p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
                <HeroMetric label="Input" value="BTC signals" />
                <HeroMetric label="Method" value="visual mapping" />
                <HeroMetric label="Output" value="market organism" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.56, ease: [0.76, 0, 0.24, 1] }}
              className="relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/32 p-3 shadow-[0_0_70px_rgba(80,231,255,0.06)] md:rounded-[1.8rem] md:p-4 md:shadow-[0_0_150px_rgba(80,231,255,0.08)] md:backdrop-blur-2xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(80,231,255,0.16),transparent_34%),radial-gradient(circle_at_64%_42%,rgba(255,211,106,0.12),transparent_22%),radial-gradient(circle_at_38%_62%,rgba(255,61,110,0.12),transparent_25%)]" />
              <div className="absolute inset-0 hidden opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:42px_42px] md:block" />
              <div className="absolute left-1/2 top-[44%] hidden h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/10 md:block" />
              <div className="absolute left-1/2 top-[44%] hidden h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035] md:block" />

              <div className="relative z-10 flex min-h-[230px] items-center justify-center pb-2 pt-8 md:min-h-[310px] md:pb-3">
                <ResearchOrbit />
              </div>

              <div className="absolute left-3 top-3 z-20 rounded-full border border-white/10 bg-black/46 px-2.5 py-1.5 md:left-4 md:top-4 md:bg-black/34 md:px-3 md:backdrop-blur-xl">
                <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/48">Data to memory engine</p>
              </div>

              <div className="relative z-10 mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                {systemFlow.map((item) => (
                  <div key={item.step} className="rounded-[0.95rem] border border-white/8 bg-black/30 p-2.5 backdrop-blur-xl">
                    <p className="mono-font text-[0.42rem] uppercase tracking-[0.14em] text-white/30">{item.step}</p>
                    <p className="mt-1 text-[0.64rem] font-medium text-white/74">{item.title}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.42, ease: [0.76, 0, 0.24, 1] }}
            className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/[0.028] p-3.5 backdrop-blur-2xl"
          >
            <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
              <div>
                <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">Page guide</p>
                <p className="mt-1 text-sm text-white/58">A quick map of what this page explains.</p>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
                {pageGuide.map((item) => (
                  <div key={item.id} className="rounded-[0.9rem] border border-white/8 bg-black/18 p-2.5">
                    <p className="mono-font text-[0.46rem] uppercase tracking-[0.14em] text-white/30">{item.id}</p>
                    <p className="mt-2 text-[0.7rem] font-medium text-white/78">{item.label}</p>
                    <p className="mt-1 text-[0.58rem] leading-4 text-white/36">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <section className="py-14">
            <div className="grid gap-4 lg:grid-cols-3">
              {thesisPoints.map((item, index) => (
                <RevealCard key={item.title} delay={index * 0.06} className="group relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[0.028] p-5 backdrop-blur-2xl">
                  <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-cyan-300/8 blur-3xl transition duration-500 group-hover:bg-cyan-300/14" />
                  <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">Thesis 0{index + 1}</p>
                  <h3 className="mt-5 font-['Inter_Tight',Inter,sans-serif] text-[clamp(1.45rem,2.1vw,2.35rem)] font-medium leading-[1.04] tracking-[-0.04em] text-white">{item.title}</h3>
                  <p className="mt-4 text-[0.82rem] leading-7 text-muted">{item.text}</p>
                </RevealCard>
              ))}
            </div>
          </section>

          <section className="pb-16">
            <SplitIntro
              eyebrow="System Architecture"
              title="The project works like a translation machine."
              text="It does not try to replace financial charts. It creates another layer beside them: a visual memory layer that helps people read market behavior through form, motion and texture."
            />

            <div className="mt-7 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.028] p-4 backdrop-blur-2xl md:p-5">
              <div className="grid gap-3 xl:grid-cols-4">
                {systemFlow.map((item, index) => (
                  <RevealCard key={item.title} delay={index * 0.04} className="relative rounded-[1.15rem] border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">0{index + 1}</p>
                      <span className="h-2 w-2 rounded-full bg-cyan-200/70 shadow-[0_0_18px_rgba(80,231,255,0.5)]" />
                    </div>
                    <h3 className="mt-5 text-[1.05rem] font-medium tracking-[-0.03em] text-white/90">{item.title}</h3>
                    <p className="mt-3 text-[0.8rem] leading-6 text-muted">{item.text}</p>
                  </RevealCard>
                ))}
              </div>
            </div>
          </section>

          <section className="pb-16">
            <SplitIntro
              eyebrow="Signal Mapping"
              title="Each signal has a visual role."
              text="The visual system becomes readable only when every aesthetic decision points back to a data condition. This is the difference between random abstraction and interpretable generative art."
            />

            <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {signalMapping.map((item, index) => (
                <RevealCard key={item.signal} delay={index * 0.035} className="rounded-[1.2rem] border border-white/10 bg-black/24 p-4 backdrop-blur-2xl">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full shadow-[0_0_18px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                    <p className="mono-font text-[0.48rem] uppercase tracking-[0.16em] text-white/36">{item.signal}</p>
                  </div>
                  <h3 className="mt-4 text-xl font-medium tracking-[-0.04em] text-white/90">{item.visual}</h3>
                  <p className="mt-3 text-[0.8rem] leading-6 text-muted">{item.text}</p>
                </RevealCard>
              ))}
            </div>
          </section>

          <section className="pb-16">
            <SplitIntro
              eyebrow="Live vs Interpreted"
              title="The prototype should be honest about what is live and what is curated."
              text="This matters because the site is both a working demo and a research presentation. Visitors should understand which parts come from public historical BTC data, which parts are fallback states, and which parts are artistic visual mappings."
            />

            <div className="mt-7 grid gap-3 lg:grid-cols-3">
              {transparency.map((item, index) => (
                <RevealCard key={item.title} delay={index * 0.05} className="rounded-[1.25rem] border border-white/10 bg-white/[0.028] p-4.5 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[1.05rem] font-medium tracking-[-0.03em] text-white/90">{item.title}</h3>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-white/54">{item.tag}</span>
                  </div>
                  <p className="mt-3 text-[0.8rem] leading-6 text-muted">{item.text}</p>
                </RevealCard>
              ))}
            </div>
          </section>

          <section className="pb-16">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
              <RevealCard className="rounded-[1.55rem] border border-white/10 bg-black/28 p-5 backdrop-blur-2xl">
                <p className="label">Website Structure</p>
                <h2 className="mt-4 font-['Inter_Tight',Inter,sans-serif] text-[clamp(1.65rem,3vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.05em]">
                  Three layers tell one story.
                </h2>
                <p className="mt-4 max-w-xl text-[0.84rem] leading-7 text-muted">
                  The visitor should not have to guess why the site exists. The organism shows the system, Art Space shows its expressive range, and this page explains the method behind both.
                </p>
              </RevealCard>

              <div className="grid gap-3">
                {siteLayers.map((item, index) => (
                  <RevealCard key={item.title} delay={index * 0.05} className="rounded-[1.2rem] border border-white/10 bg-white/[0.028] p-4 backdrop-blur-2xl">
                    <div className="flex gap-4">
                      <span className="mono-font mt-1 text-[0.52rem] uppercase tracking-[0.14em] text-white/30">0{index + 1}</span>
                      <div>
                        <h3 className="text-[1.05rem] font-medium tracking-[-0.03em] text-white/88">{item.title}</h3>
                        <p className="mt-2 text-[0.8rem] leading-6 text-muted">{item.text}</p>
                      </div>
                    </div>
                  </RevealCard>
                ))}
              </div>
            </div>
          </section>

          <section className="pb-6">
            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.028] p-5 backdrop-blur-2xl md:p-6">
              <div className="absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full bg-cyan-300/8 blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
                <div>
                  <p className="label">Roadmap / Next Steps</p>
                  <h2 className="mt-4 max-w-2xl font-['Inter_Tight',Inter,sans-serif] text-[clamp(1.6rem,2.9vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.048em]">
                    The current version is a working demo, not the final system.
                  </h2>
                </div>

                <div className="space-y-3">
                  {roadmap.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-[1rem] border border-white/8 bg-black/18 p-3">
                      <span className="mono-font mt-1 text-[0.52rem] uppercase tracking-[0.14em] text-white/30">0{index + 1}</span>
                      <p className="text-[0.82rem] leading-6 text-muted">{item}</p>
                    </div>
                  ))}

                  <p className="pt-2 text-xs leading-6 text-white/36">
                    Econography is a visual research prototype. It is not financial advice, not a trading signal and not a prediction engine. Historical BTC data may depend on public API availability, UTC date windows and provider limits. If selected-date data cannot be loaded, the interface avoids showing a synthetic BTC price.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function ResearchOrbit() {
  return (
    <div className="relative h-[205px] w-[205px] sm:h-[250px] sm:w-[250px] md:h-[300px] md:w-[300px]">
      <div className="absolute inset-0 rounded-full border border-cyan-200/18 bg-cyan-200/[0.02] shadow-[0_0_90px_rgba(80,231,255,0.08)]" />
      <div className="absolute inset-[11%] rounded-full border border-white/8" />
      <div className="absolute inset-[23%] rounded-full border border-amber-200/14" />
      <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,211,106,0.5),rgba(80,231,255,0.14)_42%,transparent_72%)] md:h-16 md:w-16 md:blur-[1px]" />

      {signalMapping.map((item, index) => {
        const angle = (index / signalMapping.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * 43 + 50;
        const y = Math.sin(angle) * 43 + 50;

        return (
          <div
            key={item.signal}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className="h-3 w-3 rounded-full shadow-[0_0_24px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
            <span className="rounded-full border border-white/8 bg-black/34 px-2 py-0.5 text-[0.48rem] uppercase tracking-[0.1em] text-white/48 backdrop-blur-xl">
              {item.signal}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SplitIntro({ eyebrow, title, text }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
      <div>
        <p className="label">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl font-['Inter_Tight',Inter,sans-serif] text-[clamp(1.65rem,3vw,3.35rem)] font-medium leading-[1.05] tracking-[-0.048em]">
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-[0.88rem] leading-7 text-muted">{text}</p>
    </div>
  );
}

function RevealCard({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ delay: Math.min(delay, 0.08), duration: 0.42, ease: [0.76, 0, 0.24, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/[0.028] p-3 backdrop-blur-xl">
      <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}