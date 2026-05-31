
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, PointMaterial, Points } from "@react-three/drei";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { fetchBTCMarketData } from "../services/btcService";
import { fetchBTCHistoryData } from "../services/btcHistoryService";
import { normalizeBTCData } from "../utils/normalizeBTCData";
import { normalizeBTCHistoryData } from "../utils/normalizeBTCHistoryData";
import currentMarketMemoryArtwork from "../assets/current-market-memory.jpg";
import stressMembraneArtwork from "../assets/stress-membrane-apr-2025.jpg";
import expansionBloomArtwork from "../assets/expansion-bloom-jul-2025.jpg";
import fractureFieldArtwork from "../assets/fracture-field-feb-2026.jpg";
const FALLBACK_BTC_PAYLOAD = {
  source: "fallback",
  isLive: false,
  raw: {
    usd: 107034,
    usd_market_cap: 2110000000000,
    usd_24h_vol: 42000000000,
    usd_24h_change: 2.4,
    last_updated_at: Math.floor(Date.now() / 1000),
  },
};

const HERO_ARTWORK = currentMarketMemoryArtwork;

const MAPPING = [
  {
    label: "Price Direction",
    value: "Form Drift",
    color: "#D8CCFF",
    text: "Price movement bends the central field and changes the artwork’s directional gravity.",
  },
  {
    label: "Volume",
    value: "Particle Density",
    color: "#FFD36A",
    text: "Higher participation increases luminous grains, golden pressure and field thickness.",
  },
  {
    label: "Volatility",
    value: "Distortion",
    color: "#FF8A2A",
    text: "Volatility creates tearing, turbulence and sharper waves across the memory surface.",
  },
  {
    label: "Risk",
    value: "Red Pressure",
    color: "#FF3D6E",
    text: "Negative pressure introduces warmer red fields and compressive visual tension.",
  },
  {
    label: "Liquidity",
    value: "Cyan Flow",
    color: "#50E7FF",
    text: "Liquidity smooths the field with cooler circulation and fluid continuity.",
  },
];

export default function ArtSpacePage() {
  const [pulse, setPulse] = useState(() => normalizeBTCData(FALLBACK_BTC_PAYLOAD));
  const [history, setHistory] = useState(null);
  const [status, setStatus] = useState("syncing");
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0);
  const heroSectionRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadArtData() {
      try {
        setStatus("syncing");
        const [marketPayload, historyPayload] = await Promise.all([
          fetchBTCMarketData(),
          fetchBTCHistoryData("1D"),
        ]);

        const normalizedPulse = normalizeBTCData(marketPayload);
        const normalizedHistory = normalizeBTCHistoryData(historyPayload, {
          range: "1D",
          maxPoints: 240,
        });

        if (!isMounted) return;

        setPulse(normalizedPulse);
        setHistory(normalizedHistory);
        setStatus(normalizedPulse.isLive || normalizedHistory.isLive ? "live" : "fallback");
      } catch (error) {
        console.warn("Art Space BTC data failed. Keeping fallback artwork:", error);
        if (!isMounted) return;
        setStatus("fallback");
      }
    }

    loadArtData();
    const interval = window.setInterval(loadArtData, 60 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const points = useMemo(() => {
    if (Array.isArray(history?.points) && history.points.length) return history.points;
    return createFallbackArtSeries(pulse);
  }, [history, pulse]);

  const artState = useMemo(() => buildArtState(pulse, points), [pulse, points]);
  const archive = useMemo(() => buildCuratedSnapshotGallery(pulse, points), [pulse, points]);
  const activeArtwork = archive[selectedArtworkIndex] || archive[0];
  function selectArtwork(index) {
    setSelectedArtworkIndex(index);
    window.requestAnimationFrame(() => {
      heroSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] pt-20 text-white">
      <div className="absolute inset-0 hero-atmosphere opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(216,204,255,0.12),transparent_34%),radial-gradient(circle_at_82%_40%,rgba(255,61,110,0.09),transparent_28%),radial-gradient(circle_at_18%_66%,rgba(80,231,255,0.1),transparent_32%)]" />

      <section className="page-padding relative z-10 pb-12">
        <div className="mx-auto max-w-[1720px]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            className="mb-3 flex items-center justify-between gap-4 border-b border-white/8 pb-3"
          >
            <div>
              <h1 className="text-[1.15rem] font-medium tracking-[-0.04em] text-white">ART SPACE</h1>
              <p className="mono-font mt-1 text-[0.48rem] uppercase tracking-[0.18em] text-white/40">
                Hourly generative financial memories
              </p>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-emerald-300" : "bg-amber-300"} shadow-[0_0_18px_currentColor]`} />
              <p className="mono-font text-[0.5rem] uppercase tracking-[0.18em] text-white/48">
                {status === "syncing" ? "Syncing Artwork" : status === "live" ? "Live Data Artwork" : "Fallback Artwork"}
              </p>
            </div>
          </motion.div>

          <motion.div
            ref={heroSectionRef}
            initial={{ opacity: 0, y: 28, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12, duration: 1, ease: [0.76, 0, 0.24, 1] }}
            className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-black shadow-[0_0_220px_rgba(139,163,255,0.18)]"
          >
            <div className="relative p-4 lg:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_380px]">
                <div className="relative min-h-[520px] overflow-hidden rounded-[1.55rem] border border-white/10 bg-black/40 p-4">
                  <div className="absolute inset-4 overflow-hidden rounded-[1.25rem] bg-black/40">
                    <img
                      src={activeArtwork.image}
                      alt={`${activeArtwork.label} generative artwork`}
                      className="h-full w-full object-contain object-center"
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_56%_46%,transparent_0%,rgba(3,4,6,0.08)_52%,rgba(3,4,6,0.68)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.2)_42%,rgba(0,0,0,0.08)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent_18%,transparent_76%,rgba(0,0,0,0.44))]" />

                  <div className="absolute left-7 top-7 z-20 max-w-[430px] rounded-[1.15rem] border border-white/10 bg-black/44 p-3.5 backdrop-blur-2xl">
                    <p className="mono-font text-[0.5rem] uppercase tracking-[0.18em] text-white/42">{activeArtwork.period} BTC Artwork</p>
                    <h2 className="mt-2 text-[clamp(1.25rem,2.35vw,2.45rem)] font-medium leading-[0.95] tracking-[-0.06em] text-white">
                      {activeArtwork.label}
                    </h2>
                    <p className="mt-2 max-w-sm text-xs leading-5 text-white/52">
                      {activeArtwork.heroDescription}
                    </p>
                  </div>

                  <div className="absolute bottom-7 left-7 right-7 z-20 rounded-[1rem] border border-white/10 bg-black/42 p-2.5 backdrop-blur-2xl">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <MiniMetric label="Price" value={activeArtwork.price} />
                      <MiniMetric label="Change" value={activeArtwork.change} />
                      <MiniMetric label="Volume" value={activeArtwork.volume} />
                      <MiniMetric label="Risk" value={activeArtwork.risk} />
                    </div>
                  </div>
                </div>

                <aside className="grid content-start gap-4">
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-2xl">
                    <p className="mono-font text-[0.5rem] uppercase tracking-[0.18em] text-white/36">Artwork Reading</p>
                    <h3 className="mt-2 text-xl font-medium tracking-[-0.04em] text-white">{activeArtwork.readingTitle}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/52">
                      {activeArtwork.reason}
                    </p>
                  </div>

                  <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-2xl">
                    <p className="mono-font text-[0.5rem] uppercase tracking-[0.18em] text-white/36">Visual Meaning</p>
                    <div className="mt-4 space-y-3">
                      {activeArtwork.meanings.map((meaning) => (
                        <MeaningItem key={meaning.title} color={meaning.color} title={meaning.title} text={meaning.text} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-2xl">
                    <p className="mono-font text-[0.5rem] uppercase tracking-[0.18em] text-white/36">Artwork DNA</p>
                    <div className="mt-3 space-y-2.5">
                      {activeArtwork.dna.map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[0.62rem] text-white/54">{item.label}</p>
                            <p className="text-[0.6rem] font-medium text-white/84">{item.value}%</p>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
                            <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="mt-3 grid gap-3 xl:grid-cols-[0.95fr_1.25fr_0.8fr]"
          >
            <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.028] p-3 backdrop-blur-2xl">
              <p className="mono-font text-[0.44rem] uppercase tracking-[0.18em] text-white/38">BTC Art Metadata</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <MiniMetric label="Source" value={pulse.source || "market"} />
                <MiniMetric label="Status" value={status} />
                <MiniMetric label="Points" value={`${points.length}`} />
                <MiniMetric label="Method" value="WebGL" />
              </div>
            </section>

            <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.028] p-3 backdrop-blur-2xl">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <p className="mono-font text-[0.44rem] uppercase tracking-[0.18em] text-white/38">Visual Mapping</p>
                  <h2 className="mt-1 text-[1.05rem] font-medium tracking-[-0.03em] text-white/90">Financial signals as artistic material</h2>
                </div>
                <p className="max-w-sm text-[0.66rem] leading-5 text-white/42">
                  This is not a chart. The data becomes color, texture, pressure and motion.
                </p>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-5">
                {MAPPING.map((item) => (
                  <article key={item.label} className="rounded-[0.95rem] border border-white/10 bg-black/24 p-2.5">
                    <span className="block h-2 w-2 rounded-full shadow-[0_0_14px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                    <p className="mt-2 text-[0.68rem] font-medium text-white/86">{item.label}</p>
                    <p className="mt-0.5 text-[0.46rem] uppercase tracking-[0.11em] text-white/32">{item.value}</p>
                    <p className="mt-1 line-clamp-2 text-[0.52rem] leading-4 text-white/42">{item.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[1.45rem] border border-white/10 bg-white/[0.028] p-3 backdrop-blur-2xl">
              <p className="mono-font text-[0.44rem] uppercase tracking-[0.18em] text-white/38">Pipeline</p>
              <div className="mt-3 space-y-2">
                <PipelineItem label="Data" value="BTC market stream" />
                <PipelineItem label="Mapping" value="HSV / density / distortion" />
                <PipelineItem label="Render" value="Three.js / WebGL" />
                <PipelineItem label="Future" value="AI latent texture layer" />
              </div>
            </section>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="mt-3 rounded-[1.45rem] border border-white/10 bg-white/[0.028] p-3 backdrop-blur-2xl"
          >
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="mono-font text-[0.44rem] uppercase tracking-[0.18em] text-white/38">Curated Memory Snapshots</p>
                <h2 className="mt-1 text-[1.05rem] font-medium tracking-[-0.03em] text-white/90">Selected BTC market states</h2>
              </div>
              <p className="max-w-md text-[0.68rem] leading-5 text-white/44">
                Select a market state to inspect its artwork, data reading and visual meaning. Each image translates a different emotional condition of Bitcoin into a living financial organism.
              </p>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {archive.map((item) => (
                <article
                  key={item.label}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectArtwork(item.index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") selectArtwork(item.index);
                  }}
                  className={`group cursor-pointer overflow-hidden rounded-[1.15rem] border p-2.5 transition duration-300 hover:border-white/22 hover:bg-white/[0.04] ${selectedArtworkIndex === item.index ? "border-white/28 bg-white/[0.06] shadow-[0_0_60px_rgba(80,231,255,0.12)]" : "border-white/10 bg-black/24"}`}
                >
                  <div className="relative h-[220px] overflow-hidden rounded-[0.9rem] border border-white/8" style={{ background: item.background }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={`${item.label} generative artwork`}
                        className="absolute inset-0 h-full w-full object-cover opacity-95 transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 opacity-70" style={{ background: item.texture }} />
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,0.1)_42%,rgba(0,0,0,0.55)_100%)]" />
                    <div className="absolute left-3 top-3 rounded-full border border-white/12 bg-black/30 px-2.5 py-1 backdrop-blur-xl">
                      <p className="mono-font text-[0.42rem] uppercase tracking-[0.16em] text-white/62">{item.period}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.75rem] font-medium text-white/86">{item.label}</p>
                      <p className="mt-0.5 text-[0.55rem] uppercase tracking-[0.12em] text-white/34">{item.mood}</p>
                      <p className="mt-3 text-[0.66rem] leading-5 text-white/46">{item.reason}</p>
                    </div>
                    <p className="text-right text-[0.68rem] font-medium text-white/72">{item.price}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/8 pt-3">
                    <SnapshotMetric label="Change" value={item.change} color={item.changeColor} />
                    <SnapshotMetric label="Volume" value={item.volume} color="#FFD36A" />
                    <SnapshotMetric label="Risk" value={item.risk} color="#FF3D6E" />
                  </div>
                </article>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
function SnapshotMetric({ label, value, color }) {
  return (
    <div>
      <p className="mono-font text-[0.36rem] uppercase tracking-[0.12em] text-white/28">{label}</p>
      <p className="mt-0.5 text-[0.58rem] font-medium" style={{ color }}>{value}</p>
    </div>
  );
}
function GenerativeArtCanvas({ pulse, points, artState }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.04, 5.65], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#02040A"]} />
      <fog attach="fog" args={["#02040A", 8.5, 20]} />
      <ambientLight intensity={0.42} />
      <pointLight position={[0, 1.6, 3]} intensity={4.2} color={artState.mainColor} />
      <pointLight position={[-3.2, -0.8, -1.6]} intensity={2.2} color="#50E7FF" />
      <pointLight position={[3.4, 0.8, -1.8]} intensity={2.15} color="#FF3D6E" />
      <pointLight position={[0, -2.4, 1.6]} intensity={1.55} color="#FFD36A" />

      <ArtField pulse={pulse} points={points} artState={artState} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.22}
        zoomSpeed={0.42}
        enablePan={false}
        minDistance={4.2}
        maxDistance={9.2}
      />
    </Canvas>
  );
}

function ArtField({ pulse, points, artState }) {
  const fieldRef = useRef();
  const chromaRef = useRef();
  const mistRef = useRef();
  const waterfallRef = useRef();

  const field = useMemo(() => buildArtGeometry(points, pulse), [points, pulse]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (fieldRef.current) {
      fieldRef.current.rotation.y = Math.sin(time * 0.045) * 0.035 * artState.liquidity;
      fieldRef.current.rotation.x = Math.sin(time * 0.035) * 0.022 * artState.volatility;
      fieldRef.current.rotation.z = Math.cos(time * 0.04) * 0.025 * artState.risk;
    }

    if (chromaRef.current) {
      chromaRef.current.rotation.y = -time * (0.006 + artState.liquidity * 0.006);
      chromaRef.current.position.y = Math.sin(time * 0.16) * 0.08;
    }

    if (mistRef.current) {
      mistRef.current.rotation.y = time * (0.003 + artState.liquidity * 0.004);
      mistRef.current.rotation.z = Math.sin(time * 0.05) * 0.018;
    }

    if (waterfallRef.current) {
      waterfallRef.current.rotation.y = Math.sin(time * 0.05) * 0.025;
      waterfallRef.current.position.y = Math.sin(time * 0.2) * 0.055;
    }
  });

  return (
    <group ref={fieldRef} scale={[1.28, 1.24, 1.12]}>
      <ArtColorWashes artState={artState} />

      <Points positions={field.atmosphericMist} stride={3}>
        <PointMaterial
          transparent
          color="#8D6BFF"
          size={0.02 + artState.volatility * 0.018}
          sizeAttenuation
          depthWrite={false}
          opacity={0.18 + artState.volatility * 0.28}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <group ref={mistRef}>
        <Points positions={field.deepSpaceParticles} stride={3}>
          <PointMaterial
            transparent
            color="#A7F2FF"
            size={0.007 + artState.liquidity * 0.005}
            sizeAttenuation
            depthWrite={false}
            opacity={0.24 + artState.liquidity * 0.2}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>

      <Points positions={field.baseParticles} stride={3}>
        <PointMaterial
          transparent
          color={artState.particleColor}
          size={0.016 + artState.volume * 0.018}
          sizeAttenuation
          depthWrite={false}
          opacity={0.78 + artState.volume * 0.38 + artState.liquidity * 0.2}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <group ref={chromaRef}>
        <Points positions={field.chromaParticles} stride={3}>
          <PointMaterial
            transparent
            color="#C878FF"
            size={0.011 + artState.volatility * 0.009}
            sizeAttenuation
            depthWrite={false}
            opacity={0.68 + artState.volatility * 0.32}
            blending={THREE.AdditiveBlending}
          />
        </Points>

        <Points positions={field.goldParticles} stride={3}>
          <PointMaterial
            transparent
            color="#FFD36A"
            size={0.012 + artState.volume * 0.012}
            sizeAttenuation
            depthWrite={false}
            opacity={0.48 + artState.volume * 0.42}
            blending={THREE.AdditiveBlending}
          />
        </Points>

        <Points positions={field.riskParticles} stride={3}>
          <PointMaterial
            transparent
            color="#FF3D6E"
            size={0.012 + artState.risk * 0.012}
            sizeAttenuation
            depthWrite={false}
            opacity={0.44 + artState.risk * 0.44}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>

      {/* Cyan and Magenta particle fields */}
      <Points positions={field.cyanField} stride={3}>
        <PointMaterial
          transparent
          color="#50E7FF"
          size={0.028 + artState.liquidity * 0.024}
          sizeAttenuation
          depthWrite={false}
          opacity={0.76 + artState.liquidity * 0.38}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points positions={field.magentaField} stride={3}>
        <PointMaterial
          transparent
          color="#FF4FD8"
          size={0.024 + artState.volatility * 0.02}
          sizeAttenuation
          depthWrite={false}
          opacity={0.66 + artState.volatility * 0.34}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <group ref={waterfallRef}>
        {field.waterfalls.map((fall) => (
          <Line
            key={fall.id}
            points={fall.points}
            color={fall.color}
            lineWidth={fall.width}
            transparent
            opacity={fall.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        ))}
      </group>

      {field.memoryBands.map((band) => (
        <Line
          key={band.id}
          points={band.points}
          color={band.color}
          lineWidth={band.width}
          transparent
          opacity={band.opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ))}

      {field.textureThreads.map((thread) => (
        <Line
          key={thread.id}
          points={thread.points}
          color={thread.color}
          lineWidth={thread.width}
          transparent
          opacity={thread.opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ))}
    </group>
  );
}

// ---- Color Washes visual overlay ----
function ArtColorWashes({ artState }) {
  const washRef = useRef();

  const washes = useMemo(() => {
    const cyan = [];
    const magenta = [];
    const gold = [];
    const violet = [];
    const count = 2200;

    for (let i = 0; i < count; i += 1) {
      const t = i / Math.max(1, count - 1);
      const wave = Math.sin(t * Math.PI * 7.5 + seededJitter(i, 40) * 2.5);
      const curl = Math.cos(t * Math.PI * 5.2 + seededJitter(i, 41) * 2.2);
      const x = (t - 0.5) * 6.1 + wave * 0.8;
      const y = wave * 0.72 + seededJitter(i, 42) * 0.75;
      const z = curl * 1.2 + seededJitter(i, 43) * 0.55 - 0.55;

      if (i % 4 === 0) {
        cyan.push(x - 0.75, y - 0.08, z);
      } else if (i % 4 === 1) {
        magenta.push(x + 0.35, y + 0.18, z - 0.08);
      } else if (i % 4 === 2) {
        gold.push(x + 0.05, y - 0.34, z + 0.06);
      } else {
        violet.push(x, y + 0.04, z - 0.18);
      }
    }

    return {
      cyan: new Float32Array(cyan),
      magenta: new Float32Array(magenta),
      gold: new Float32Array(gold),
      violet: new Float32Array(violet),
    };
  }, []);

  useFrame((state) => {
    if (!washRef.current) return;

    const time = state.clock.elapsedTime;
    washRef.current.rotation.y = Math.sin(time * 0.035) * 0.035;
    washRef.current.rotation.z = Math.sin(time * 0.055) * 0.025;
    washRef.current.position.y = Math.sin(time * 0.16) * 0.04;
  });

  return (
    <group ref={washRef} position={[0, 0.02, -0.42]} scale={[1.08, 1.12, 1]}>
      <Points positions={washes.cyan} stride={3}>
        <PointMaterial
          transparent
          color="#50E7FF"
          size={0.038 + artState.liquidity * 0.02}
          sizeAttenuation
          depthWrite={false}
          opacity={0.18 + artState.liquidity * 0.2}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points positions={washes.magenta} stride={3}>
        <PointMaterial
          transparent
          color="#FF4FD8"
          size={0.034 + artState.volatility * 0.018}
          sizeAttenuation
          depthWrite={false}
          opacity={0.14 + artState.volatility * 0.18 + artState.risk * 0.08}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points positions={washes.gold} stride={3}>
        <PointMaterial
          transparent
          color="#FFD36A"
          size={0.036 + artState.volume * 0.02}
          sizeAttenuation
          depthWrite={false}
          opacity={0.14 + artState.volume * 0.22}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points positions={washes.violet} stride={3}>
        <PointMaterial
          transparent
          color="#8D6BFF"
          size={0.034 + artState.volatility * 0.016}
          sizeAttenuation
          depthWrite={false}
          opacity={0.12 + artState.volatility * 0.14}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function buildArtGeometry(points, pulse) {
  const source = points.length ? points : createFallbackArtSeries(pulse);
  const volume = safeRatio(pulse.volume, 0.48);
  const volatility = safeRatio(pulse.volatility, 0.38);
  const risk = safeRatio(pulse.risk, 0.3);
  const liquidity = safeRatio(pulse.liquidity, 0.58);
  const particleCount = Math.min(12800, Math.max(5200, source.length * 48));

  const baseParticles = [];
  const chromaParticles = [];
  const riskParticles = [];
  const goldParticles = [];
  const deepSpaceParticles = [];
  const atmosphericMist = [];
  const cyanField = [];
  const magentaField = [];

  for (let i = 0; i < particleCount; i += 1) {
    const point = source[i % source.length] || {};
    const progress = i / Math.max(1, particleCount - 1);
    const pointProgress = safeNumber(point.progress, progress);
    const price = safeRatio(point.priceNormalized, 0.5);
    const localVolume = safeRatio(point.volumeNormalized, volume);
    const localVolatility = safeRatio(point.localVolatility, volatility);
    const isRisk = point.direction < 0;

    const layer = Math.floor(progress * 9);
    const goldenAngle = i * 2.399963229728653;
    const horizontalFlow = (pointProgress - 0.5) * 5.85;
    const waveAngle = goldenAngle * 0.028 + layer * 0.44;
    const fieldWave = Math.sin(pointProgress * Math.PI * 7.5 + layer) * (0.46 + localVolatility * 0.95);
    const liquidityCurl = Math.cos(pointProgress * Math.PI * 4.6 + goldenAngle * 0.012) * liquidity * 0.72;
    const priceLift = (price - 0.5) * 2.55;
    const volumeSpread = 0.72 + localVolume * 1.85;
    const x = horizontalFlow + Math.cos(waveAngle) * (0.35 + volumeSpread) + seededJitter(i, 44) * (0.08 + localVolatility * 0.28);
    const y = priceLift + fieldWave + seededJitter(i, 71) * localVolatility * 0.44;
    const z = Math.sin(waveAngle) * (0.75 + volumeSpread) + liquidityCurl + seededJitter(i, 96) * 0.18;

    baseParticles.push(x, y, z);

    if (i % 2 === 0) {
      chromaParticles.push(
        x + Math.sin(progress * Math.PI * 13) * 0.16,
        y + Math.cos(progress * Math.PI * 9) * 0.1,
        z + Math.sin(progress * Math.PI * 7) * 0.14
      );
    }

    if (isRisk && i % 2 === 0) {
      riskParticles.push(
        x - risk * 0.42 + seededJitter(i, 18) * 0.16,
        y + localVolatility * 0.22,
        z + seededJitter(i, 19) * 0.18
      );
    }

    if (!isRisk && localVolume > 0.42 && i % 3 === 0) {
      goldParticles.push(
        x + localVolume * 0.28,
        y - 0.08 + localVolume * 0.2,
        z + seededJitter(i, 22) * 0.18
      );
    }

    if (i % 4 === 0) {
      deepSpaceParticles.push(
        (seededJitter(i, 91) * 2 + pointProgress - 0.5) * 6.2,
        seededJitter(i, 111) * 3.2 + (price - 0.5) * 0.9,
        seededJitter(i, 112) * 4.4
      );
    }

    if (i % 5 === 0) {
      atmosphericMist.push(
        horizontalFlow + seededJitter(i, 204) * 2.2,
        priceLift + seededJitter(i, 205) * 1.4,
        seededJitter(i, 206) * 2.2
      );
    }

    if (i % 3 === 0) {
      cyanField.push(
        horizontalFlow + Math.sin(pointProgress * Math.PI * 5.6) * (0.82 + liquidity * 1.15),
        priceLift + Math.cos(pointProgress * Math.PI * 3.4) * (0.42 + localVolatility * 0.72),
        Math.sin(waveAngle) * (1.1 + liquidity * 1.35) + seededJitter(i, 307) * 0.26
      );
    }

    if (i % 4 === 0) {
      magentaField.push(
        horizontalFlow + Math.cos(pointProgress * Math.PI * 6.2) * (0.72 + localVolatility * 1.12),
        priceLift + Math.sin(pointProgress * Math.PI * 4.8) * (0.52 + localVolatility * 0.92),
        Math.cos(waveAngle) * (0.9 + risk * 1.18) + seededJitter(i, 407) * 0.28
      );
    }
  }

  const waterfalls = Array.from({ length: 72 }, (_, fallIndex) => {
    const fallProgress = fallIndex / 71;
    const sourcePoint = source[Math.floor(fallProgress * (source.length - 1))] || {};
    const localVolume = safeRatio(sourcePoint.volumeNormalized, volume);
    const localVolatility = safeRatio(sourcePoint.localVolatility, volatility);
    const isRisk = sourcePoint.direction < 0;
    const xAnchor = (fallProgress - 0.5) * 5.8;
    const zAnchor = seededJitter(fallIndex, 808) * 1.4;
    const path = [];

    for (let i = 0; i < 96; i += 1) {
      const t = i / 95;
      const sideWave = Math.sin(t * Math.PI * 4.5 + fallIndex) * (0.18 + localVolatility * 0.45);
      const y = 2.35 - t * (4.4 + localVolatility * 0.8) + Math.sin(t * Math.PI * 9 + fallIndex) * 0.08;
      const x = xAnchor + sideWave + Math.cos(t * Math.PI * 2 + fallIndex) * localVolume * 0.18;
      const z = zAnchor + Math.sin(t * Math.PI * 3 + fallIndex) * (0.45 + localVolume * 0.35);
      path.push(new THREE.Vector3(x, y, z));
    }

    return {
      id: `abstract-waterfall-${fallIndex}`,
      points: path,
      color: isRisk ? "#FF3D6E" : localVolume > 0.56 ? "#FFD36A" : fallIndex % 4 === 0 ? "#D8CCFF" : fallIndex % 3 === 0 ? "#FF8A2A" : "#50E7FF",
      width: 0.055 + localVolume * 0.22 + localVolatility * 0.095,
      opacity: 0.22 + localVolume * 0.26 + localVolatility * 0.16,
    };
  });

  const memoryBands = Array.from({ length: 42 }, (_, bandIndex) => {
    const bandProgress = bandIndex / 41;
    const path = [];

    for (let i = 0; i < 170; i += 1) {
      const t = i / 169;
      const sourcePoint = source[Math.floor(t * (source.length - 1))] || {};
      const price = safeRatio(sourcePoint.priceNormalized, 0.5);
      const localVolume = safeRatio(sourcePoint.volumeNormalized, volume);
      const localVolatility = safeRatio(sourcePoint.localVolatility, volatility);
      const x = (t - 0.5) * 6.2;
      const y = (price - 0.5) * 1.9 + Math.sin(t * Math.PI * 5.5 + bandIndex) * (0.14 + localVolatility * 0.42) + (bandProgress - 0.5) * 1.8;
      const z = Math.sin(t * Math.PI * 4 + bandIndex * 0.4) * (0.55 + liquidity * 0.65) + localVolume * 0.36;
      path.push(new THREE.Vector3(x, y, z));
    }

    return {
      id: `memory-band-${bandIndex}`,
      points: path,
      color: bandIndex % 5 === 0 ? "#FFD36A" : bandIndex % 4 === 0 ? "#FF3D6E" : bandIndex % 3 === 0 ? "#D8CCFF" : "#50E7FF",
      width: 0.045 + volume * 0.12 + volatility * 0.07,
      opacity: 0.16 + liquidity * 0.13 + volume * 0.075,
    };
  });

  const textureThreads = Array.from({ length: 56 }, (_, threadIndex) => {
    const threadProgress = threadIndex / 55;
    const path = [];

    for (let i = 0; i < 92; i += 1) {
      const t = i / 91;
      const sourcePoint = source[Math.floor(t * (source.length - 1))] || {};
      const localVolatility = safeRatio(sourcePoint.localVolatility, volatility);
      const localVolume = safeRatio(sourcePoint.volumeNormalized, volume);
      const x = (t - 0.5) * 6.4 + Math.sin(threadProgress * Math.PI * 2) * 0.5;
      const y = Math.sin(t * Math.PI * 9 + threadIndex) * (0.08 + localVolatility * 0.36) + (threadProgress - 0.5) * 2.4;
      const z = Math.cos(t * Math.PI * 6 + threadIndex) * (0.2 + localVolume * 0.34) + seededJitter(threadIndex, i) * 0.12;
      path.push(new THREE.Vector3(x, y, z));
    }

    return {
      id: `texture-thread-${threadIndex}`,
      points: path,
      color: threadIndex % 6 === 0 ? "#FF8A2A" : threadIndex % 5 === 0 ? "#D8CCFF" : "#A7F2FF",
      width: 0.026 + volatility * 0.06,
      opacity: 0.13 + volatility * 0.11,
    };
  });

  return {
    baseParticles: new Float32Array(baseParticles),
    chromaParticles: new Float32Array(chromaParticles),
    riskParticles: new Float32Array(riskParticles),
    goldParticles: new Float32Array(goldParticles),
    deepSpaceParticles: new Float32Array(deepSpaceParticles),
    atmosphericMist: new Float32Array(atmosphericMist),
    cyanField: new Float32Array(cyanField),
    magentaField: new Float32Array(magentaField),
    waterfalls,
    memoryBands,
    textureThreads,
  };
}

function buildArtState(pulse, points) {
  const risk = safeRatio(pulse.risk, 0.3);
  const volume = safeRatio(pulse.volume, 0.48);
  const volatility = safeRatio(pulse.volatility, 0.38);
  const liquidity = safeRatio(pulse.liquidity, 0.58);
  const change = safeNumber(pulse.change24h, 0);

  const title =
    risk > 0.68
      ? "Pressure Bloom"
      : volatility > 0.66
      ? "Volatility Veil"
      : volume > 0.64
      ? "Golden Liquidity Field"
      : liquidity > 0.62
      ? "Cyan Memory Drift"
      : "Chromatic Financial Field";

  const subtitle =
    change >= 0
      ? "A data-born field painting shaped by upward pressure, volume and liquid continuity."
      : "A compressed chromatic field shaped by risk, volatility and directional contraction.";

  return {
    title,
    subtitle,
    risk,
    volume,
    volatility,
    liquidity,
    mainColor: risk > 0.62 ? "#FF3D6E" : volume > 0.6 ? "#FFD36A" : "#A7F2FF",
    secondaryColor: liquidity > 0.55 ? "#50E7FF" : "#D8CCFF",
    particleColor: risk > 0.62 ? "#FF8A2A" : volume > 0.5 ? "#FFD36A" : "#50E7FF",
    dna: [
      { label: "Density", value: Math.round(volume * 100), color: "#FFD36A" },
      { label: "Distortion", value: Math.round(volatility * 100), color: "#FF8A2A" },
      { label: "Risk Pressure", value: Math.round(risk * 100), color: "#FF3D6E" },
      { label: "Liquidity Flow", value: Math.round(liquidity * 100), color: "#50E7FF" },
    ],
    pointsCount: points.length,
  };
}


function samplePrice(points, ratio, fallback) {
  const source = Array.isArray(points) && points.length ? points : [];
  const point = source[Math.min(source.length - 1, Math.max(0, Math.floor(source.length * ratio)))] || {};
  return safeNumber(point.price, fallback);
}

function buildCuratedSnapshotGallery(pulse, points) {
  const source = points.length ? points : createFallbackArtSeries(pulse);
  const currentPrice = safeNumber(pulse.price, 107034);
  const currentChange = safeNumber(pulse.change24h, 1.13);
  const currentVolume = safeNumber(pulse.volume24h, 27400000000);
  const currentRisk = Math.round(safeRatio(pulse.risk, 0.22) * 100);

  const snapshots = [
    {
      label: "Current Market Memory",
      period: "Now",
      image: currentMarketMemoryArtwork,
      mood: currentChange >= 0 ? "compressed upward tissue" : "compressed risk tissue",
      heroDescription: "A live BTC state translated into a compressed but breathing financial membrane.",
      price: formatCurrency(currentPrice),
      change: formatPercent(currentChange),
      changeColor: currentChange >= 0 ? "#7CFFB2" : "#FF6F91",
      volume: formatCompactCurrency(currentVolume),
      risk: `${currentRisk}%`,
      readingTitle: "Compressed market tissue",
      reason:
        "Used as the live reference state. It shows the current market as compressed but still liquid: cyan flow remains visible while the membrane holds quiet pressure.",
      meanings: [
        { color: "#50E7FF", title: "Cyan liquidity flow", text: "Cool circulation shows that market movement still continues." },
        { color: "#FFD36A", title: "Gold volume sediment", text: "Dense particles represent participation and accumulated transaction weight." },
        { color: "#FF3D8A", title: "Magenta risk pressure", text: "Thin warmer veins show subtle stress without full breakdown." },
        { color: "#FFFFFF", title: "Stretched membrane", text: "Open cavities express volatility and structural tension." },
      ],
      dna: [
        { label: "Density", value: Math.max(12, Math.round(safeRatio(pulse.volume, 0.48) * 100)), color: "#FFD36A" },
        { label: "Distortion", value: Math.round(safeRatio(pulse.volatility, 0.38) * 100), color: "#FF8A2A" },
        { label: "Risk Pressure", value: currentRisk, color: "#FF3D6E" },
        { label: "Liquidity Flow", value: Math.round(safeRatio(pulse.liquidity, 0.58) * 100), color: "#50E7FF" },
      ],
      seed: 0.16,
      palette: ["rgba(80,231,255,0.86)", "rgba(255,211,106,0.74)", "rgba(255,79,216,0.48)"],
    },
    {
      label: "Stress Membrane",
      period: "Apr 7, 2025",
      image: stressMembraneArtwork,
      mood: "stress / drawdown state",
      heroDescription: "A fear-driven drawdown state where the market membrane stretches under pressure.",
      price: "$74,508",
      change: "-6.19%",
      changeColor: "#FF6F91",
      volume: "$37.6B",
      risk: "82%",
      readingTitle: "A market under pressure",
      reason:
        "Selected because it represents a visibly different market emotion: fear, pressure and reduced liquidity. The magenta tissue dominates while cyan recedes into smaller pockets.",
      meanings: [
        { color: "#FF3D8A", title: "Magenta risk pressure", text: "Fear and sell pressure spread as warmer veins across the tissue." },
        { color: "#8D98A7", title: "Sparse liquidity flow", text: "Reduced cyan flow shows weaker market circulation and lower confidence." },
        { color: "#FFD36A", title: "Low volume sediment", text: "Thin gold particles indicate activity that is less constructive." },
        { color: "#FFFFFF", title: "Torn membrane", text: "Large stretched cavities reflect volatility and structural strain." },
      ],
      dna: [
        { label: "Density", value: 18, color: "#FFD36A" },
        { label: "Distortion", value: 78, color: "#FF8A2A" },
        { label: "Risk Pressure", value: 82, color: "#FF3D6E" },
        { label: "Liquidity Flow", value: 19, color: "#50E7FF" },
      ],
      seed: 0.38,
      palette: ["rgba(255,61,110,0.82)", "rgba(255,255,255,0.42)", "rgba(80,231,255,0.24)"],
    },
    {
      label: "Expansion Bloom",
      period: "Jul 10, 2025",
      image: expansionBloomArtwork,
      mood: "record expansion state",
      heroDescription: "A record-breaking rise translated into an opening financial bloom of liquidity and participation.",
      price: "$116,000+",
      change: "+12.47%",
      changeColor: "#7CFFB2",
      volume: "$89.3B",
      risk: "31%",
      readingTitle: "A record-breaking expansion phase",
      reason:
        "Selected to represent a major breakout moment. The golden core expresses rising participation and institutional demand, while cyan streams show expanding liquidity and a freer market structure.",
      meanings: [
        { color: "#FFD36A", title: "Golden participation core", text: "The bright center represents rising volume, conviction and institutional demand." },
        { color: "#50E7FF", title: "Expanding liquidity streams", text: "Cyan ribbons show liquidity opening outward instead of retreating." },
        { color: "#FFFFFF", title: "Translucent bloom", text: "The open petals translate price confidence into a freer financial organism." },
        { color: "#D8CCFF", title: "Soft remaining risk", text: "Subtle violet traces show that risk remains present but no longer dominates." },
      ],
      dna: [
        { label: "Density", value: 76, color: "#FFD36A" },
        { label: "Distortion", value: 34, color: "#FF8A2A" },
        { label: "Risk Pressure", value: 31, color: "#FF3D6E" },
        { label: "Liquidity Flow", value: 84, color: "#50E7FF" },
      ],
      seed: 0.62,
      palette: ["rgba(255,211,106,0.86)", "rgba(80,231,255,0.72)", "rgba(216,204,255,0.42)"],
    },
    {
      label: "Fracture Field",
      period: "Feb 5, 2026",
      image: fractureFieldArtwork,
      mood: "liquidation / structural break",
      heroDescription: "A severe breakdown state translated into a torn market wound and retreating liquidity.",
      price: "$63,296",
      change: "-14.20%",
      changeColor: "#FF6F91",
      volume: "$98.1B",
      risk: "91%",
      readingTitle: "A severe fracture phase",
      reason:
        "Selected to show an extreme breakdown state rather than a normal decline. Deep red flows express liquidation pressure, the silver membrane shows structural damage, and faint cyan traces reveal liquidity retreating from the system.",
      meanings: [
        { color: "#B00020", title: "Liquidation flow", text: "Deep red streams express forced selling and market hemorrhage." },
        { color: "#DCE4EF", title: "Fractured silver membrane", text: "Pale torn surfaces show structural damage to the market body." },
        { color: "#05070C", title: "Liquidity void", text: "The dark central rupture represents support disappearing from the field." },
        { color: "#50E7FF", title: "Faint cyan retreat", text: "Weak blue traces show liquidity leaving rather than circulating." },
      ],
      dna: [
        { label: "Density", value: 29, color: "#FFD36A" },
        { label: "Distortion", value: 94, color: "#FF8A2A" },
        { label: "Risk Pressure", value: 91, color: "#FF3D6E" },
        { label: "Liquidity Flow", value: 12, color: "#50E7FF" },
      ],
      seed: 0.88,
      palette: ["rgba(176,0,32,0.88)", "rgba(220,228,239,0.44)", "rgba(80,231,255,0.14)"],
    },
  ];

  return snapshots.map((item, index) => {
    const [a, b, c] = item.palette;
    const angle = Math.round(120 + item.seed * 160);
    return {
      ...item,
      index,
      background: `radial-gradient(circle at ${28 + index * 13}% ${38 + index * 7}%, ${a}, transparent 28%), radial-gradient(circle at ${68 - index * 8}% ${54 + index * 5}%, ${b}, transparent 32%), radial-gradient(circle at 50% 48%, ${c}, transparent 42%), linear-gradient(${angle}deg, rgba(2,4,10,1), rgba(8,10,24,1))`,
      texture: `repeating-linear-gradient(${angle}deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 16px), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), transparent 2px)`,
    };
  });
}

function createFallbackArtSeries(pulse = {}) {
  const basePrice = safeNumber(pulse.price, 107034);

  return Array.from({ length: 180 }, (_, index) => {
    const progress = index / 179;
    const wave = Math.sin(progress * Math.PI * 2.4) * 0.06 + Math.sin(progress * Math.PI * 7.2) * 0.025;
    const priceNormalized = clamp01(0.5 + wave);

    return {
      index,
      progress,
      price: basePrice * (0.97 + priceNormalized * 0.06),
      timestamp: Date.now() - (179 - index) * 60 * 60 * 1000,
      direction: Math.sin(progress * Math.PI * 8.4) > 0 ? 1 : -1,
      priceNormalized,
      volumeNormalized: clamp01(0.34 + Math.sin(progress * Math.PI * 5.1) * 0.24 + 0.12),
      localVolatility: clamp01(0.18 + Math.abs(Math.sin(progress * Math.PI * 8.5)) * 0.34),
    };
  });
}

function PipelineItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-white/8 bg-black/20 px-3 py-2">
      <p className="text-[0.58rem] text-white/42">{label}</p>
      <p className="text-[0.58rem] font-medium text-white/76">{value}</p>
    </div>
  );
}


function MeaningItem({ color, title, text }) {
  return (
    <div className="flex gap-3">
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_18px_currentColor]"
        style={{ backgroundColor: color, color }}
      />
      <div>
        <p className="text-sm font-medium text-white/82">{title}</p>
        <p className="text-xs leading-5 text-white/42">{text}</p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div>
      <p className="mono-font text-[0.36rem] uppercase tracking-[0.12em] text-white/28">{label}</p>
      <p className="mt-0.5 truncate text-[0.58rem] capitalize text-white/70">{value}</p>
    </div>
  );
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeRatio(value, fallback = 0.5) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return clamp01(number);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function seededJitter(seed, salt = 0) {
  const x = Math.sin((seed + 1) * (salt + 7) * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) - 0.5;
}

function formatCurrency(value) {
  const number = safeNumber(value, 0);
  if (number <= 0) return "$—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatCompactCurrency(value) {
  const number = safeNumber(value, 0);
  if (number <= 0) return "$—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatPercent(value) {
  const number = safeNumber(value, 0);
  const prefix = number >= 0 ? "+" : "";
  return `${prefix}${number.toFixed(2)}%`;
}

function formatTime(timestamp) {
  const value = safeNumber(timestamp, Date.now() / 1000);
  return new Date(value * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}