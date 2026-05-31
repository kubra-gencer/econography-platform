import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import BTCOrganismV2 from "../visualization/btc-organism/BTCOrganismV2";
import FullscreenStage from "../components/visual/FullscreenStage";
import { fetchBTCMarketData } from "../services/btcService";
import { fetchBTCHistoryByDate, fetchBTCHistoryData } from "../services/btcHistoryService";
import { normalizeBTCHistoryData } from "../utils/normalizeBTCHistoryData";
import { normalizeBTCData } from "../utils/normalizeBTCData";

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

const RANGE_OPTIONS = ["1D", "7D", "30D"];

const HISTORICAL_PRESETS = [
  {
    label: "Apr 7",
    date: "2025-04-07",
    range: "30D",
    note: "drawdown",
    market: {
      price: 74508,
      change24h: -6.19,
      volume24h: 37600000000,
      volume: 0.38,
      volatility: 0.78,
      risk: 0.82,
      liquidity: 0.19,
      health: 0.34,
      source: "historical marker",
      isLive: false,
    },
  },
  {
    label: "Jul 10",
    date: "2025-07-10",
    range: "30D",
    note: "record",
    market: {
      price: 116046,
      change24h: 8.72,
      volume24h: 89300000000,
      volume: 0.76,
      volatility: 0.34,
      risk: 0.31,
      liquidity: 0.84,
      health: 0.88,
      source: "historical marker",
      isLive: false,
    },
  },
  {
    label: "Feb 5",
    date: "2026-02-05",
    range: "30D",
    note: "fracture",
    market: {
      price: 63296,
      change24h: -14.2,
      volume24h: 98100000000,
      volume: 0.92,
      volatility: 0.94,
      risk: 0.91,
      liquidity: 0.12,
      health: 0.18,
      source: "historical marker",
      isLive: false,
    },
  },
];

const VISUAL_LAYERS = [
  {
    id: "core",
    label: "BTC Core Organism",
    value: "live nucleus",
    color: "#FFD36A",
    text: "The central nucleus reacts to live market pressure, health and liquidity.",
  },
  {
    id: "orbit",
    label: "Memory Orbit",
    value: "price as time",
    color: "#A7F2FF",
    text: "Historical BTC prices are wrapped into a spatial orbit instead of a flat chart.",
  },
  {
    id: "cells",
    label: "Memory Cells",
    value: "market moments",
    color: "#50E7FF",
    text: "Each inspection node stores a price, volume, volatility and direction signal.",
  },
  {
    id: "fabric",
    label: "Warm Data Fabric",
    value: "volume texture",
    color: "#FF8A2A",
    text: "High participation creates amber granular fields around active market areas.",
  },
  {
    id: "risk",
    label: "Volatility Scars",
    value: "risk pressure",
    color: "#FF3D6E",
    text: "Stress and contraction appear as red pressure, scars and sharper shapes.",
  },
  {
    id: "flow",
    label: "Liquidity Flow",
    value: "blue circulation",
    color: "#50E7FF",
    text: "Liquid market conditions appear as smoother blue atmospheric circulation.",
  },
];

export default function BTCPage() {
  const [pulse, setPulse] = useState(() => normalizeBTCData(FALLBACK_BTC_PAYLOAD));
  const [selectedRange, setSelectedRange] = useState("7D");
  const [memoryMode, setMemoryMode] = useState("range");
  const [selectedDate, setSelectedDate] = useState("");
  const [pendingDate, setPendingDate] = useState("");
  const [btcHistory, setBtcHistory] = useState(null);
  const [dateHistory, setDateHistory] = useState(null);
  const [dateHistoryStatus, setDateHistoryStatus] = useState("idle");
  const [historyStatus, setHistoryStatus] = useState("syncing");
  const [status, setStatus] = useState("syncing");

  useEffect(() => {
    let isMounted = true;

    async function loadBTCData() {
      try {
        setStatus("syncing");
        const marketPayload = await fetchBTCMarketData();
        const normalized = normalizeBTCData(marketPayload);

        if (!isMounted) return;

        setPulse((previousPulse) => ({
          ...previousPulse,
          ...normalized,
        }));
        setStatus(normalized.isLive ? "live" : "fallback");
      } catch (error) {
        console.warn("BTC live data failed. Keeping fallback pulse:", error);
        if (!isMounted) return;
        setStatus("fallback");
      }
    }

    loadBTCData();
    const interval = window.setInterval(loadBTCData, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadBTCHistory() {
      try {
        setHistoryStatus("syncing");
        const historyPayload = await fetchBTCHistoryData(selectedRange);
        const normalizedHistory = normalizeBTCHistoryData(historyPayload, {
          range: selectedRange,
          maxPoints: selectedRange === "1D" ? 180 : 260,
        });

        if (!isMounted) return;

        setBtcHistory(normalizedHistory);
        setHistoryStatus(normalizedHistory.isLive ? "live" : "fallback");
      } catch (error) {
        console.warn("BTC history data failed:", error);
        if (!isMounted) return;
        setHistoryStatus("fallback");
      }
    }

    loadBTCHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedRange]);

  useEffect(() => {
  let isMounted = true;

  async function loadDateHistory() {
    if (memoryMode !== "date" || !selectedDate) {
      setDateHistory(null);
      setDateHistoryStatus("idle");
      return;
    }

    try {
      setDateHistoryStatus("syncing");

      const historyPayload = await fetchBTCHistoryByDate(selectedDate, 1);
      const normalizedHistory = normalizeBTCHistoryData(historyPayload, {
        range: "date",
        maxPoints: 180,
      });

      if (!isMounted) return;

      setDateHistory({
        ...normalizedHistory,
        selectedDate,
        source: historyPayload.source || "coingecko-historical-date",
      });

      setDateHistoryStatus(normalizedHistory.points?.length ? "live" : "fallback");
    } catch (error) {
      console.warn("BTC selected date history failed:", error);
      if (!isMounted) return;
      setDateHistory(null);
      setDateHistoryStatus("fallback");
    }
  }

  loadDateHistory();

  return () => {
    isMounted = false;
  };
}, [memoryMode, selectedDate]);

  const activeHistoricalPreset = useMemo(() => {
    if (memoryMode !== "date" || !selectedDate) return null;
    return HISTORICAL_PRESETS.find((preset) => preset.date === selectedDate) || null;
  }, [memoryMode, selectedDate]);

  const effectivePulse = useMemo(() => {
  if (memoryMode !== "date" || !selectedDate) return pulse;

  const realDatePulse = buildPulseFromHistoricalPoints(dateHistory?.points, selectedDate, activeHistoricalPreset);

  if (realDatePulse) {
    return {
      ...pulse,
      ...realDatePulse,
    };
  }

  if (!activeHistoricalPreset) {
    return {
      ...pulse,
      date: selectedDate,
      markerDate: selectedDate,
      markerLabel: "Custom Date",
      source: "selected date fallback",
      isLive: false,
      lastUpdatedAt: Math.floor(new Date(`${selectedDate}T12:00:00Z`).getTime() / 1000),
    };
  }

  return {
    ...pulse,
    ...activeHistoricalPreset.market,
    date: activeHistoricalPreset.date,
    markerDate: activeHistoricalPreset.date,
    markerLabel: activeHistoricalPreset.label,
    source: "historical marker fallback",
    isLive: false,
    lastUpdatedAt: Math.floor(new Date(`${activeHistoricalPreset.date}T12:00:00Z`).getTime() / 1000),
  };
}, [activeHistoricalPreset, dateHistory, memoryMode, pulse, selectedDate]);

  const points = useMemo(() => {
  if (memoryMode === "date" && selectedDate) {
    const datePoints = Array.isArray(dateHistory?.points) ? dateHistory.points : [];
    if (datePoints.length) return datePoints;
    return createFallbackSeries(effectivePulse);
  }

  const rawPoints = Array.isArray(btcHistory?.points) ? btcHistory.points : [];
  if (rawPoints.length) return rawPoints;

  return createFallbackSeries(effectivePulse);
}, [btcHistory, dateHistory, effectivePulse, memoryMode, selectedDate]);

  const updatedTime = useMemo(() => {
  if (memoryMode === "date" && selectedDate) return formatReadableDate(selectedDate);

  const timestamp = safeNumber(effectivePulse.lastUpdatedAt, Date.now() / 1000);
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}, [effectivePulse.lastUpdatedAt, memoryMode, selectedDate]);

  const todayDate = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const memoryState = useMemo(() => buildMemoryState(effectivePulse), [effectivePulse]);
  const synthesisCards = useMemo(() => buildSynthesisCards(effectivePulse, points), [effectivePulse, points]);
  const organismMetrics = useMemo(() => buildOrganismMetrics(effectivePulse, points), [effectivePulse, points]);
  const composition = useMemo(() => buildComposition(effectivePulse), [effectivePulse]);
  const timeline = useMemo(() => buildTimeline(points), [points]);
  const activeTimeLabel = memoryMode === "date" && selectedDate ? formatReadableDate(selectedDate) : selectedRange;

  const btcLegend = useMemo(
    () => [
      {
        label: "Live Memory State",
        value: memoryState.label,
        text: `${memoryState.tone}. ${memoryState.text}`,
      },
      ...VISUAL_LAYERS.map((layer) => ({
        label: layer.label,
        value: layer.value,
        text: layer.text,
      })),
      {
        label: "Time Range",
        value: activeTimeLabel,
        text: "The selected range determines how much historical BTC memory is compressed into the organism.",
      },
    ],
    [activeTimeLabel, memoryState]
  );

  function selectHistoricalPreset(preset) {
    setMemoryMode("date");
    setSelectedDate(preset.date);
    setPendingDate(preset.date);
    setSelectedRange(preset.range);
  }

  function applySelectedDate() {
    if (!pendingDate || pendingDate > todayDate) return;
    setMemoryMode("date");
    setSelectedDate(pendingDate);
    setSelectedRange("30D");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] pt-32 text-white md:pt-36">
      <div className="absolute inset-0 hero-atmosphere opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(117,148,255,0.12),transparent_34%),radial-gradient(circle_at_78%_42%,rgba(255,138,42,0.08),transparent_28%),radial-gradient(circle_at_18%_64%,rgba(80,231,255,0.09),transparent_32%)]" />

      <section className="page-padding relative z-10 pb-12 md:pb-16">
        <div className="mx-auto max-w-[1540px]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end"
          >
            <div>
              <p className="label">ECONOGRAPHY / BTC MEMORY ENGINE</p>
              <h1 className="mt-3 max-w-3xl font-['Inter_Tight',Inter,sans-serif] text-[clamp(1.45rem,2.55vw,2.65rem)] font-medium leading-[1.06] tracking-[-0.048em]">
                Bitcoin market data becomes a living financial organism.
              </h1>
            </div>

            <div className="max-w-md rounded-[1.45rem] border border-white/10 bg-white/[0.035] p-3.5 backdrop-blur-2xl">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${status === "live" ? "bg-emerald-300" : "bg-amber-300"} shadow-[0_0_18px_currentColor]`} />
                <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/42">
                  {memoryMode === "date" && selectedDate ? (dateHistoryStatus === "live" ? "Historical data loaded" : dateHistoryStatus === "syncing" ? "Loading historical data" : "Historical fallback") : status === "syncing" ? "Syncing stream" : status === "live" ? "Stream active" : "Fallback stream"}
                </p>
              </div>
              <p className="mt-2.5 text-[0.8rem] leading-6 text-white/58">
                {memoryMode === "date" && selectedDate
  ? `Viewing ${formatReadableDate(selectedDate)}. BTC historical data is fetched for the selected date when available; fallback interpretation is used only if the historical request fails.`
  : "Price, volume, volatility, risk and liquidity are mapped into orbit, density, scars, flow and core pressure."}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 1, ease: [0.76, 0, 0.24, 1] }}
            className="grid min-w-0 gap-4 2xl:grid-cols-[250px_minmax(0,1fr)_270px]"
          >
            <div className="hidden 2xl:block">
              <VisualLayersPanel
                layers={VISUAL_LAYERS}
                source={effectivePulse.source}
                status={memoryMode === "date" && selectedDate ? "historical" : status}
                updatedTime={updatedTime}
                historyStatus={memoryMode === "date" && selectedDate ? dateHistoryStatus : historyStatus}
              />
            </div>

            <main className="min-w-0">
              <div className="relative h-[clamp(460px,62vh,680px)] min-w-0 overflow-hidden rounded-t-[1.8rem] border border-b-0 border-white/10 bg-black shadow-[0_0_160px_rgba(139,163,255,0.12)] md:rounded-t-[2.2rem]">
                <BTCOrganismV2
                  pulse={effectivePulse}
                  history={
                    memoryMode === "date" && selectedDate
                      ? { points, isLive: dateHistoryStatus === "live", source: dateHistory?.source || "selected historical date" }
                      : btcHistory
                  }
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.02)_46%,rgba(3,4,6,0.70)_100%)]" />

                <div className="absolute left-0 right-0 top-0 z-20 flex min-h-[68px] items-center justify-between gap-3 border-b border-white/10 bg-black/28 px-4 py-2.5 backdrop-blur-2xl md:min-h-[74px] md:px-6">
                  <div>
                    <p className="mono-font text-[0.42rem] uppercase tracking-[0.16em] text-white/40">BTC Memory Organism</p>
                    <h2 className="system-title mt-1 max-w-[12rem] text-[clamp(1rem,1.65vw,1.65rem)] leading-[1.05] md:max-w-none">{memoryState.label}</h2>
                  </div>

                  <div className="hidden items-center gap-3 text-right xl:flex">
                    <StageInfo label="Updated" value={updatedTime} />
                    <StageInfo label={memoryMode === "date" && selectedDate ? "Marker" : "Range"} value={activeTimeLabel} />
                    <StageInfo label="Source" value={effectivePulse.source || "unknown"} />
                    <FullscreenStage
                      title="BTC Memory Organism"
                      subtitle={memoryState.text}
                      triggerLabel="Expand Organism"
                      legend={btcLegend}
                    >
                      <BTCOrganismV2
                        pulse={effectivePulse}
                        history={
                          memoryMode === "date" && selectedDate
                            ? { points, isLive: dateHistoryStatus === "live", source: dateHistory?.source || "selected historical date" }
                            : btcHistory
                        }
                      />
                    </FullscreenStage>
                  </div>
                </div>
              </div>

              <MemoryControlPanel
                selectedRange={selectedRange}
                memoryMode={memoryMode}
                selectedDate={selectedDate}
                pendingDate={pendingDate}
                todayDate={todayDate}
                points={points}
                dateHistoryStatus={dateHistoryStatus}
                onSelectRange={(range) => {
                  setMemoryMode("range");
                  setSelectedRange(range);
                }}
                onChangePendingDate={setPendingDate}
                onApplyDate={applySelectedDate}
                onSelectPreset={selectHistoricalPreset}
              />

              <OrganismMetricsRow metrics={organismMetrics} />

              <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
                <MemoryTimeline timeline={timeline} compact />
                <MemoryComposition composition={composition} compact />
              </div>
            </main>

            <div className="grid gap-4 2xl:hidden">
              <MarketSynthesisPanel cards={synthesisCards} memoryState={memoryState} points={points} compact />
            </div>
            <div className="hidden 2xl:block">
              <MarketSynthesisPanel cards={synthesisCards} memoryState={memoryState} points={points} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="mt-4"
          >
            <FlowIntensityMap points={points} pulse={effectivePulse} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <SystemInterpretation memoryState={memoryState} pulse={effectivePulse} />
            <ResearchBridge />
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function VisualLayersPanel({ layers, source, status, updatedTime, historyStatus }) {
  return (
    <aside className="rounded-[1.6rem] border border-white/10 bg-white/[0.028] p-3 backdrop-blur-2xl 2xl:min-h-[690px]">
      <div className="rounded-[1.45rem] border border-white/10 bg-black/28 p-4">
        <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">Live Source</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <MiniStatus label="Market" value={status} />
          <MiniStatus label="History" value={historyStatus} />
          <MiniStatus label="Source" value={source || "unknown"} />
          <MiniStatus label="Updated" value={updatedTime} />
        </div>
      </div>

      <div className="mt-3 rounded-[1.45rem] border border-white/10 bg-black/18 p-3">
        <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">Visual Layers</p>
        <p className="mt-2 text-[0.6rem] leading-5 text-white/38">
          These are symbolic layer guides. The actual forms appear inside the BTC organism as core, orbit, cells, fabric, scars and liquidity flow.
        </p>
        <div className="mt-3 space-y-2">
          {layers.map((layer) => (
            <article key={layer.id} className="rounded-[1rem] border border-white/8 bg-white/[0.025] p-2.5 transition duration-300 hover:border-white/16 hover:bg-white/[0.045]">
              <div className="flex items-start gap-3">
                <LayerGlyph color={layer.color} id={layer.id} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[0.76rem] font-medium text-white/84">{layer.label}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[0.48rem] uppercase tracking-[0.12em] text-white/36">
                      {layer.value}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.62rem] leading-5 text-white/46">{layer.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}

function MarketSynthesisPanel({ cards, memoryState, points, compact = false }) {
  return (
    <aside className={`rounded-[1.6rem] border border-white/10 bg-white/[0.028] p-3 backdrop-blur-2xl ${compact ? "" : "2xl:min-h-[690px]"}`}>
      <div className="mt-3 rounded-[1.45rem] border border-white/10 bg-black/18 p-3">
        <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">Current Market Reading</p>
        <h2 className="mt-3 text-[1.25rem] font-medium tracking-[-0.03em] text-white/90">Market state: {memoryState.label}</h2>
        <p className="mt-2 text-xs leading-6 text-white/46">{memoryState.tone}</p>
        <p className="mt-2 text-[0.6rem] leading-5 text-white/34">
          Live range and selected-date sparklines use normalized BTC history when available. Fallback simulation appears only if the historical request fails.
        </p>
      </div>

      <div className={`mt-3 ${compact ? "grid gap-2 md:grid-cols-2 xl:grid-cols-3" : "space-y-2.5"}`}>
        {cards.map((card) => (
          <article key={card.label} className="rounded-[1.15rem] border border-white/10 bg-black/22 p-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-white/34">{card.label}</p>
                <p className="mt-2 text-[1.05rem] font-medium text-white/88">{card.value}</p>
                <p className="mt-1 text-[0.62rem] text-white/42">{card.caption}</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]" style={{ backgroundColor: card.color, color: card.color }} />
            </div>
            <Sparkline values={card.sparkline} color={card.color} />
          </article>
        ))}
      </div>

      <div className={`mt-4 rounded-[1.45rem] border border-white/10 bg-black/22 p-4 ${compact ? "hidden" : ""}`}>
        <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-white/34">Micro Price Memory</p>
        <Sparkline values={points.map((point) => safeNumber(point.priceNormalized, 0.5))} color="#D8CCFF" height={70} />
      </div>
    </aside>
  );
}

function MemoryControlPanel({ selectedRange, memoryMode, selectedDate, pendingDate, todayDate, points, dateHistoryStatus, onSelectRange, onChangePendingDate, onApplyDate, onSelectPreset }) {
  return (
    <section className="rounded-b-[1.8rem] border border-t-0 border-white/10 bg-black/42 px-4 py-3 backdrop-blur-2xl md:rounded-b-[2.2rem] md:px-6 md:py-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-stretch">
        <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.025] p-3">
          <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="mono-font text-[0.44rem] uppercase tracking-[0.15em] text-white/34">Range Memory</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {RANGE_OPTIONS.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => onSelectRange(range)}
                    className={`rounded-full border px-2.5 py-1.5 text-[0.5rem] font-medium uppercase tracking-[0.1em] transition duration-300 ${
                      memoryMode === "range" && selectedRange === range
                        ? "border-white/40 bg-white text-black"
                        : "border-white/10 bg-white/[0.035] text-white/58 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/8 pt-3 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
              <p className="mono-font text-[0.44rem] uppercase tracking-[0.15em] text-white/34">Saved Date Markers</p>
              <p className="mt-1 text-[0.58rem] leading-4 text-white/34">
                {memoryMode === "date" && selectedDate
                  ? `Selected: ${formatReadableDate(selectedDate)}`
                  : "No saved date selected yet."}
              </p>

              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(170px,0.95fr)_auto] sm:items-center">
                <label className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-[0.48rem] uppercase tracking-[0.1em] text-white/44">
                  <span>Date</span>
                  <input
                    type="date"
                    value={pendingDate}
                    max={todayDate}
                    onChange={(event) => onChangePendingDate(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[0.54rem] text-white/72 outline-none [color-scheme:dark]"
                  />
                </label>

                <button
                  type="button"
                  disabled={!pendingDate || pendingDate > todayDate}
                  onClick={onApplyDate}
                  className="rounded-full border border-white/10 bg-white px-3 py-1.5 text-[0.46rem] font-medium uppercase tracking-[0.1em] text-black transition duration-300 hover:bg-white/85 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.04] disabled:text-white/24"
                >
                  Apply
                </button>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {HISTORICAL_PRESETS.map((preset) => (
                  <button
                    key={preset.date}
                    type="button"
                    title={`${preset.date} • ${preset.note}`}
                    onClick={() => onSelectPreset(preset)}
                    className={`rounded-full border px-2 py-1.5 text-[0.46rem] font-medium uppercase tracking-[0.08em] transition duration-300 ${
                      memoryMode === "date" && selectedDate === preset.date
                        ? "border-cyan-200/50 bg-cyan-200/14 text-cyan-50 shadow-[0_0_24px_rgba(80,231,255,0.12)]"
                        : "border-white/10 bg-white/[0.025] text-white/42 hover:border-white/20 hover:text-white/74"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <p className="mt-2 text-[0.55rem] leading-4 text-white/28">
                Future dates are disabled. Saved markers fetch historical BTC data first; fallback interpretation is used only if the historical request fails.
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.25rem] border border-white/8 bg-white/[0.025] p-3 text-[0.62rem] leading-5 text-white/42">
          <p className="mono-font text-[0.42rem] uppercase tracking-[0.15em] text-white/32">Active Memory</p>
          <div className="mt-2 space-y-1.5">
            <p className="text-white/60">{points.length} memory points</p>
            <p>{memoryMode === "date" && selectedDate ? `Date: ${formatReadableDate(selectedDate)}` : `Range: ${selectedRange}`}</p>
            {memoryMode === "date" && selectedDate && (
              <p className="rounded-full border border-cyan-200/15 bg-cyan-200/8 px-2.5 py-1 text-[0.56rem] uppercase tracking-[0.12em] text-cyan-50/70">
                Historical data: {dateHistoryStatus === "live" ? "API loaded" : dateHistoryStatus === "syncing" ? "loading" : "fallback"}
              </p>
            )}
            <p className="text-white/34">Hover on desktop or tap on mobile for local price, volume and volatility.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function OrganismMetricsRow({ metrics }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.028] p-3.5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-white/34">{metric.label}</p>
            <p className="text-sm font-medium text-white/84">{metric.value}</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full" style={{ width: `${metric.percent}%`, backgroundColor: metric.color }} />
          </div>
          <p className="mt-2 text-[0.62rem] leading-5 text-white/42">{metric.caption}</p>
        </article>
      ))}
    </div>
  );
}

function MemoryTimeline({ timeline, compact = false }) {
  return (
    <section className={`rounded-[2rem] border border-white/10 bg-white/[0.028] backdrop-blur-2xl ${compact ? "p-4" : "p-5"}`}>
      <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">Sampled Price Memories</p>
      <p className="mt-2 text-[0.6rem] leading-5 text-white/38">
        These values are selected sample prices from the active memory range. They show how the organism remembers price movement over time, not official daily open or close prices.
      </p>
      <div className={`${compact ? "mt-3 space-y-2" : "mt-5 space-y-3"}`}>
        {timeline.map((item) => (
          <div key={`${item.label}-${item.price}`} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-white/60 shadow-[0_0_14px_rgba(255,255,255,0.35)]" />
            <div className="flex flex-1 items-baseline justify-between gap-4 border-b border-white/8 pb-2">
              <p className="text-xs text-white/48">{item.label}</p>
              <p className="text-sm font-medium text-white/82">{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MemoryComposition({ composition, compact = false }) {
  const circumference = 2 * Math.PI * 42;
  let offset = 0;

  return (
    <section className={`rounded-[2rem] border border-white/10 bg-white/[0.028] backdrop-blur-2xl ${compact ? "p-4" : "p-5"}`}>
      <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">Memory Composition</p>
      <div className={`${compact ? "mt-3 gap-4" : "mt-5 gap-5"} flex items-center`}>
        <svg viewBox="0 0 100 100" className={`${compact ? "h-24 w-24" : "h-32 w-32"} shrink-0 rotate-[-90deg]`}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          {composition.map((item) => {
            const dash = (item.percent / 100) * circumference;
            const circle = (
              <circle
                key={item.label}
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={item.color}
                strokeWidth="8"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>

        <div className="min-w-0 flex-1 space-y-2">
          {composition.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-white/58">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className="font-medium text-white/82">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function FlowIntensityMap({ points, pulse }) {
  const [selectedCell, setSelectedCell] = useState(null);

  const cells = useMemo(() => {
    const source = points.length ? points : createFallbackSeries(pulse);
    return Array.from({ length: 56 }, (_, index) => {
      const point = source[index % source.length] || {};
      const value = safeRatio(point.volumeNormalized, 0.4) * 0.55 + safeRatio(point.localVolatility, 0.3) * 0.45;
      const risk = point.direction < 0;

      return {
        id: index,
        value,
        color: risk ? "#FF3D6E" : value > 0.62 ? "#FFD36A" : "#50E7FF",
        label: risk ? "Negative pressure" : value > 0.62 ? "High activity" : "Smoother flow",
        price: point.price,
        volume: safeRatio(point.volumeNormalized, 0.4),
        volatility: safeRatio(point.localVolatility, 0.3),
      };
    });
  }, [points, pulse]);

  const activeCell = selectedCell ?? cells[0];

  return (
    <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.028] p-4 backdrop-blur-2xl md:rounded-[2rem] md:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div>
          <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">Market Pressure Grid</p>
          <p className="mt-2 max-w-4xl text-[0.64rem] leading-5 text-white/42">
            Cells are sampled from the selected BTC memory range and read left to right, top to bottom. Brightness is calculated from volume and local volatility: 55% volume intensity + 45% volatility. Cyan means smoother flow, gold means high activity, and pink means negative price pressure.
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[0.56rem] uppercase tracking-[0.13em] text-white/36">
            <span className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1">Order: oldest sample → newest sample</span>
            <span className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1">Tap cells on mobile</span>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1.5 sm:grid-cols-8">
            {cells.map((cell) => {
              const isSelected = activeCell?.id === cell.id;

              return (
                <button
                  key={cell.id}
                  type="button"
                  title={`${cell.label} • pressure ${Math.round(cell.value * 100)}% • volume ${Math.round(cell.volume * 100)}% • volatility ${Math.round(cell.volatility * 100)}%`}
                  aria-label={`${cell.label}, pressure ${Math.round(cell.value * 100)} percent`}
                  onClick={() => setSelectedCell(cell)}
                  className={`h-4 rounded-full border transition duration-300 hover:scale-y-125 focus:outline-none focus:ring-2 focus:ring-white/25 ${
                    isSelected ? "scale-y-125 border-white/45" : "border-white/5 hover:border-white/20"
                  }`}
                  style={{
                    backgroundColor: cell.color,
                    opacity: 0.18 + cell.value * 0.68,
                    boxShadow: `0 0 ${6 + cell.value * 18}px ${cell.color}`,
                  }}
                />
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 text-[0.58rem] uppercase tracking-[0.14em] text-white/34 md:grid-cols-3">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-cyan-100/70">Cyan: smoother flow</span>
            <span className="rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-amber-100/70">Gold: high activity</span>
            <span className="rounded-full border border-pink-400/20 bg-pink-400/5 px-3 py-2 text-pink-100/70">Pink: negative pressure</span>
          </div>
        </div>

        <aside className="rounded-[1.25rem] border border-white/10 bg-black/24 p-4">
          <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-white/34">Selected Cell</p>

          <div className="mt-3 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]"
              style={{ backgroundColor: activeCell?.color, color: activeCell?.color }}
            />
            <p className="text-sm font-medium text-white/82">{activeCell?.label}</p>
          </div>

          <div className="mt-4 grid gap-2 text-[0.72rem] text-white/52">
            <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
              <span>Pressure</span>
              <span className="text-white/82">{Math.round((activeCell?.value || 0) * 100)}%</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
              <span>Volume</span>
              <span className="text-white/82">{Math.round((activeCell?.volume || 0) * 100)}%</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
              <span>Volatility</span>
              <span className="text-white/82">{Math.round((activeCell?.volatility || 0) * 100)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Sample</span>
              <span className="text-white/82">#{(activeCell?.id || 0) + 1}</span>
            </div>
          </div>

          <p className="mt-4 text-[0.6rem] leading-5 text-white/34">
            Desktop users can hover cells. Mobile users can tap a cell to keep its values visible here.
          </p>
        </aside>
      </div>
    </section>
  );
}

function SystemInterpretation({ memoryState, pulse }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.028] p-6 backdrop-blur-2xl">
      <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">System Interpretation</p>
      <h2 className="mt-4 text-[1.5rem] font-medium tracking-[-0.04em] text-white/90">Current system interpretation</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-white/58">
        <span className="font-medium text-white/78">{memoryState.label}:</span> {memoryState.text}
      </p>
      <p className="mt-4 text-xs leading-6 text-white/38">
        Current BTC price is {formatCurrency(pulse.price)}. This page treats market data as visual memory, not as financial advice or a trading signal.
      </p>
    </section>
  );
}

function ResearchBridge() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-black/30 p-6 backdrop-blur-2xl">
      <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">Research Entry</p>
      <h2 className="mt-4 text-[1.35rem] font-medium tracking-[-0.04em] text-white/90">How is the organism constructed?</h2>
      <p className="mt-3 text-sm leading-7 text-white/52">
        The research page explains the mapping from price, volume, volatility, liquidity and risk into orbit, density, scars, flow and visual memory.
      </p>
      <Link
       to="/research"
       className="mt-5 inline-flex rounded-full border border-cyan-200/30 bg-cyan-200/10 px-5 py-3 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-cyan-50 shadow-[0_0_28px_rgba(80,231,255,0.12)] transition hover:bg-cyan-200 hover:text-black"
>
       Open Research
    </Link>
    </section>
  );
}

function Sparkline({ values, color = "#A7F2FF", height = 48 }) {
  const normalized = normalizeValues(values);
  const width = 180;
  const points = normalized
    .map((value, index) => {
      const x = (index / Math.max(1, normalized.length - 1)) * width;
      const y = height - value * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-9 w-full overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
    </svg>
  );
}

function LayerGlyph({ color, id }) {
  if (id === "risk") {
    return <span className="mt-1 h-5 w-5 rotate-45 rounded-[0.35rem] border" style={{ borderColor: color, boxShadow: `0 0 18px ${color}` }} />;
  }

  if (id === "orbit") {
    return <span className="mt-1 h-5 w-5 rounded-full border" style={{ borderColor: color, boxShadow: `0 0 18px ${color}` }} />;
  }

  if (id === "flow") {
    return <span className="mt-1 h-5 w-5 rounded-full border border-transparent bg-gradient-to-r from-cyan-300/80 to-blue-400/20" />;
  }

  return <span className="mt-1 h-5 w-5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 18px ${color}` }} />;
}

function MiniStatus({ label, value }) {
  return (
    <div>
      <p className="mono-font text-[0.42rem] uppercase tracking-[0.14em] text-white/28">{label}</p>
      <p className="mt-1 truncate text-[0.7rem] capitalize text-white/68">{String(value)}</p>
    </div>
  );
}

function StageInfo({ label, value }) {
  return (
    <div>
      <p className="mono-font text-[0.4rem] uppercase tracking-[0.14em] text-white/36">{label}</p>
      <p className="mt-1 text-xs capitalize text-white/78">{value}</p>
    </div>
  );
}

function buildMemoryState(pulse) {
  const risk = safeRatio(pulse.risk);
  const liquidity = safeRatio(pulse.liquidity);
  const volatility = safeRatio(pulse.volatility);
  const volume = safeRatio(pulse.volume);

  if (risk > 0.72 && liquidity < 0.42) {
    return {
      label: "Structural Instability",
      tone: "Risk-dominant memory field",
      text: "Risk pressure is high while liquidity support is weak. The organism reacts through warmer halos, sharper scars and unstable atmospheric pressure.",
    };
  }

  if (volatility > 0.72 && risk > 0.52) {
    return {
      label: "Volatility Fracture",
      tone: "Unstable temporal trace",
      text: "Volatility and risk are rising together. The orbit behaves like a stressed memory path with visible rupture and distortion signals.",
    };
  }

  if (liquidity > 0.68 && risk < 0.45) {
    return {
      label: "Stable Expansion",
      tone: "Liquidity-supported flow",
      text: "Liquidity is strong while risk remains contained. The system reads this as coherent expansion with smoother ribbons and cooler atmospheric tones.",
    };
  }

  if (volume > 0.7 && volatility > 0.5) {
    return {
      label: "Aggressive Participation",
      tone: "High-activity market memory",
      text: "Volume and volatility are both active. Particle density and flow-field motion indicate stronger participation in the market memory structure.",
    };
  }

  if (risk > 0.58) {
    return {
      label: "Stress Accumulation",
      tone: "Warming risk contour",
      text: "Risk is accumulating inside the memory field. The halo and anomaly nodes become more visible as market pressure increases.",
    };
  }

  return {
    label: "Balanced Flow",
    tone: "Coherent market memory",
    text: "The market state remains balanced. Orbit, particles and atmospheric layers stay readable without strong stress deformation.",
  };
}

function buildSynthesisCards(pulse, points) {
  const series = points.map((point) => safeNumber(point.priceNormalized, 0.5));
  const volumeSeries = points.map((point) => safeRatio(point.volumeNormalized, 0.4));
  const volatilitySeries = points.map((point) => safeRatio(point.localVolatility, 0.3));
  const riskSeries = points.map((point) => (point.direction < 0 ? 0.7 : 0.25));

  return [
    {
      label: "Price Live",
      value: formatCurrency(pulse.price),
      caption: formatPercent(pulse.change24h),
      color: safeNumber(pulse.change24h) >= 0 ? "#FFD36A" : "#FF3D6E",
      sparkline: series,
    },
    {
      label: "Volume 24H",
      value: formatCompactCurrency(pulse.volume24h),
      caption: "density driver",
      color: "#FF8A2A",
      sparkline: volumeSeries,
    },
    {
      label: "Volatility",
      value: `${Math.round(safeRatio(pulse.volatility) * 100)}%`,
      caption: "distortion level",
      color: "#D8CCFF",
      sparkline: volatilitySeries,
    },
    {
      label: "Risk Level",
      value: `${Math.round(safeRatio(pulse.risk) * 100)}%`,
      caption: "compression signal",
      color: "#FF3D6E",
      sparkline: riskSeries,
    },
    {
      label: "Liquidity Flow",
      value: `${Math.round(safeRatio(pulse.liquidity) * 100)}%`,
      caption: "circulation field",
      color: "#50E7FF",
      sparkline: volumeSeries.map((value, index) => (value + series[index % series.length]) / 2),
    },
  ];
}

function buildOrganismMetrics(pulse, points) {
  const pointCount = points.length || 0;
  const density = clamp(Math.round((safeRatio(pulse.volume) * 0.55 + pointCount / 320) * 100), 0, 100);
  const clarity = clamp(Math.round((1 - safeRatio(pulse.risk) * 0.38 + safeRatio(pulse.liquidity) * 0.24) * 100), 0, 100);
  const health = clamp(Math.round(safeRatio(pulse.health, 0.72) * 100), 0, 100);

  return [
    {
      label: "Memory Density",
      value: `${(density / 10).toFixed(1)} / 10`,
      percent: density,
      color: "#FF8A2A",
      caption: "Particle pressure from volume and history.",
    },
    {
      label: "Data Points",
      value: `${pointCount}`,
      percent: clamp((pointCount / 260) * 100, 0, 100),
      color: "#A7F2FF",
      caption: "Samples forming the organism.",
    },
    {
      label: "Signal Clarity",
      value: `${clarity}%`,
      percent: clarity,
      color: "#FFF6DF",
      caption: "Balance between risk and liquidity.",
    },
    {
      label: "System Health",
      value: `${health}%`,
      percent: health,
      color: "#50E7FF",
      caption: "Overall live memory stability.",
    },
  ];
}

function buildComposition(pulse) {
  const price = 36;
  const volume = Math.round(18 + safeRatio(pulse.volume) * 12);
  const volatility = Math.round(12 + safeRatio(pulse.volatility) * 10);
  const liquidity = Math.round(12 + safeRatio(pulse.liquidity) * 10);
  let risk = Math.round(100 - price - volume - volatility - liquidity);
  risk = Math.max(8, risk);
  const total = price + volume + volatility + liquidity + risk;

  return [
    { label: "Price", percent: Math.round((price / total) * 100), color: "#A7F2FF" },
    { label: "Volume", percent: Math.round((volume / total) * 100), color: "#FF8A2A" },
    { label: "Volatility", percent: Math.round((volatility / total) * 100), color: "#D8CCFF" },
    { label: "Liquidity", percent: Math.round((liquidity / total) * 100), color: "#50E7FF" },
    { label: "Risk", percent: Math.round((risk / total) * 100), color: "#FF3D6E" },
  ];
}

function buildTimeline(points) {
  const source = points.length ? points : createFallbackSeries();
  const sampleCount = Math.min(5, source.length);

  return Array.from({ length: sampleCount }, (_, index) => {
    const sourceIndex = Math.round((index / Math.max(1, sampleCount - 1)) * (source.length - 1));
    const point = source[sourceIndex] || {};
    return {
      label: formatTimelineLabel(point.timestamp, index),
      price: formatCurrency(point.price),
    };
  });
}
function buildPulseFromHistoricalPoints(points, selectedDate, preset) {
  const cleanPoints = Array.isArray(points) ? points.filter((point) => Number.isFinite(Number(point.price))) : [];
  if (cleanPoints.length < 2) return null;

  const first = cleanPoints[0];
  const latest = cleanPoints[cleanPoints.length - 1];
  const price = safeNumber(latest.price, preset?.market?.price || 0);
  const firstPrice = safeNumber(first.price, price);
  const change24h = firstPrice ? ((price - firstPrice) / firstPrice) * 100 : 0;
  const averageVolume = cleanPoints.reduce((sum, point) => sum + safeRatio(point.volumeNormalized, 0.4), 0) / cleanPoints.length;
  const averageVolatility = cleanPoints.reduce((sum, point) => sum + safeRatio(point.localVolatility, 0.3), 0) / cleanPoints.length;
  const negativeRatio = cleanPoints.filter((point) => point.direction < 0).length / cleanPoints.length;
  const liquidity = clamp(1 - averageVolatility * 0.68 - negativeRatio * 0.18, 0.08, 0.94);
  const risk = clamp(averageVolatility * 0.72 + negativeRatio * 0.36, 0.06, 0.96);
  const timestamp = safeNumber(latest.timestamp, Date.parse(`${selectedDate}T12:00:00Z`));

  return {
    price,
    change24h,
    volume24h: preset?.market?.volume24h || price * 340000,
    volume: clamp(averageVolume, 0.05, 0.95),
    volatility: clamp(averageVolatility, 0.05, 0.95),
    risk,
    liquidity,
    health: clamp(1 - risk * 0.52 + liquidity * 0.34, 0.08, 0.96),
    date: selectedDate,
    markerDate: selectedDate,
    markerLabel: preset?.label || "Custom Date",
    source: "coingecko-historical-date",
    isLive: true,
    lastUpdatedAt: Math.floor(timestamp / 1000),
  };
}
function createFallbackSeries(pulse = {}) {
  const basePrice = safeNumber(pulse.price, 107034);
  const change = safeNumber(pulse.change24h, 0);
  const risk = safeRatio(pulse.risk, 0.35);
  const liquidity = safeRatio(pulse.liquidity, 0.55);
  const volatility = safeRatio(pulse.volatility, 0.32);
  const volume = safeRatio(pulse.volume, 0.45);
  const source = String(pulse.source || "").toLowerCase();

  const markerDateValue = pulse.date || pulse.markerDate || pulse.selectedDate;
  const markerTimestamp = markerDateValue ? Date.parse(`${markerDateValue}T12:00:00Z`) : NaN;
  const baseTimestamp = Number.isFinite(markerTimestamp) ? markerTimestamp : Date.now();

  const isHistoricalMarker = source.includes("historical");
  const isFracture = isHistoricalMarker && risk > 0.86 && liquidity < 0.22;
  const isStress = isHistoricalMarker && risk > 0.68 && change < 0 && !isFracture;
  const isExpansion = isHistoricalMarker && change > 0 && liquidity > 0.7;

  return Array.from({ length: 120 }, (_, index) => {
    const progress = index / 119;
    let shape;

    if (isFracture) {
      const crashPoint = 0.58;
      const preBreak = 0.72 - progress * 0.18;
      const breakDrop = progress > crashPoint ? (progress - crashPoint) * 1.35 : 0;
      const jagged = Math.sin(progress * Math.PI * 18) * 0.035 + Math.sin(progress * Math.PI * 41) * 0.018;
      shape = preBreak - breakDrop + jagged;
    } else if (isStress) {
      const downwardDrift = 0.68 - progress * 0.28;
      const pressureWaves = Math.sin(progress * Math.PI * 5.4) * 0.055 + Math.sin(progress * Math.PI * 15.2) * 0.025;
      shape = downwardDrift + pressureWaves;
    } else if (isExpansion) {
      const upwardDrift = 0.28 + progress * 0.48;
      const confidenceWave = Math.sin(progress * Math.PI * 3.2) * 0.035 + Math.sin(progress * Math.PI * 8.8) * 0.014;
      const lateLift = progress > 0.62 ? (progress - 0.62) * 0.16 : 0;
      shape = upwardDrift + confidenceWave + lateLift;
    } else {
      const directionBias = clamp(change / 18, -0.45, 0.45) * 0.16;
      const wave = Math.sin(progress * Math.PI * 2.4) * 0.06 + Math.sin(progress * Math.PI * 7.2) * 0.025;
      const drift = (progress - 0.5) * directionBias;
      shape = 0.5 + wave + drift;
    }

    const pressurePulse = Math.abs(Math.sin(progress * Math.PI * (6 + volatility * 8)));
    const participationWave = Math.abs(Math.sin(progress * Math.PI * (3.4 + volume * 5) + risk));
    const priceNormalized = clamp(shape, 0.04, 0.96);
    const previousShape = index === 0 ? priceNormalized : clamp(shape - Math.sin(progress * Math.PI * 2.2) * 0.025, 0.04, 0.96);

    return {
      index,
      progress,
      price: basePrice * (0.91 + priceNormalized * 0.18),
      timestamp: baseTimestamp - (119 - index) * 60 * 60 * 1000,
      direction: priceNormalized >= previousShape ? 1 : -1,
      priceNormalized,
      volumeNormalized: clamp(0.16 + volume * 0.55 + participationWave * 0.26),
      localVolatility: clamp(0.08 + volatility * 0.58 + pressurePulse * risk * 0.34),
    };
  });
}

function normalizeValues(values) {
  const clean = (Array.isArray(values) ? values : []).map((value) => safeNumber(value, 0)).filter(Number.isFinite);
  if (!clean.length) return [0.5, 0.55, 0.48, 0.62, 0.58, 0.66];

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  if (max === min) return clean.map(() => 0.5);
  return clean.map((value) => clamp((value - min) / (max - min)));
}

function formatReadableDate(value) {
  if (!value) return "No date";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatTimelineLabel(timestamp, fallbackIndex) {
  if (!timestamp) return `T-${fallbackIndex + 1}`;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return `T-${fallbackIndex + 1}`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeRatio(value, fallback = 0.5) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(1, Math.max(0, number));
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
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