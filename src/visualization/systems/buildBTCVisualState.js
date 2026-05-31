import {
  BTC_VISUAL_COLORS,
  clamp01,
  safeNumber,
  getBTCMood,
  mapCoreVisuals,
  mapPriceSpineVisuals,
  mapTerrainVisuals,
} from "./btcVisualMappings";
import {
  getHistoryPoints,
  createPriceSpinePoints,
  createFinancialTerrainLines,
  createLiquidityRiverLines,
  createMemoryCells,
  createSemanticTethers,
  createVolatilityScars,
  createAtmosphereParticles,
} from "./btcGeometryUtils";

function readPulseChange(pulse) {
  if (!pulse) return 0;

  if (typeof pulse.change === "number") return pulse.change;
  if (typeof pulse.priceChange === "number") return pulse.priceChange;
  if (typeof pulse.price_change === "number") return pulse.price_change;
  if (typeof pulse.priceChange24h === "number") return pulse.priceChange24h;
  if (typeof pulse.price_change_24h === "number") return pulse.price_change_24h;
  if (typeof pulse.change24h === "number") return pulse.change24h;

  if (typeof pulse.price === "number" && typeof pulse.prevPrice === "number") {
    return pulse.price - pulse.prevPrice;
  }

  return 0;
}

function readPulsePercentChange(pulse) {
  if (!pulse) return 0;

  if (typeof pulse.changePercent === "number") return pulse.changePercent;
  if (typeof pulse.priceChangePercent === "number") return pulse.priceChangePercent;
  if (typeof pulse.price_change_percentage_24h === "number") return pulse.price_change_percentage_24h;
  if (typeof pulse.changePercent24h === "number") return pulse.changePercent24h;

  if (typeof pulse.price === "number" && typeof pulse.prevPrice === "number" && pulse.prevPrice !== 0) {
    return ((pulse.price - pulse.prevPrice) / pulse.prevPrice) * 100;
  }

  return 0;
}

function normalizeSignals(pulse) {
  const change = readPulseChange(pulse);
  const changePercent = readPulsePercentChange(pulse);

  const volatility = clamp01(pulse?.volatility, 0.36);
  const liquidity = clamp01(pulse?.liquidity, 0.56);
  const risk = clamp01(pulse?.risk, 0.28);
  const volume = clamp01(pulse?.volume, 0.52);
  const health = clamp01(pulse?.health, 0.68);

  return {
    price: safeNumber(pulse?.price, 0),
    previousPrice: safeNumber(pulse?.prevPrice, 0),
    change,
    changePercent,
    volatility,
    liquidity,
    risk,
    volume,
    health,
    latency: safeNumber(pulse?.latency, 0),
    updatedAt: pulse?.updatedAt || pulse?.timestamp || null,
  };
}

function buildReadingSummary(signals, mood) {
  if (mood.id === "stress-field") {
    return "Risk pressure is pulling the memory field toward the BTC core. Red cells and tense tethers should become more visible.";
  }

  if (mood.id === "volatile-memory") {
    return "Volatility is bending the price spine and roughening the terrain. The organism remains readable, but the memory surface is unstable.";
  }

  if (mood.id === "recovery-pulse") {
    return "Positive activity is feeding energy back into the organism. Gold cells and warmer glow should appear around active periods.";
  }

  if (mood.id === "liquid-harmony") {
    return "Liquidity is smoothing the organism. Cyan ribbons and softer tethers should dominate the visual field.";
  }

  return "The BTC memory field is balanced. The price spine, cells and terrain remain legible without strong stress deformation.";
}

function buildVisualLegend() {
  return [
    {
      id: "price-spine",
      label: "Price Spine",
      signal: "BTC price history",
      meaning: "The main luminous line is the temporal backbone of the organism.",
      color: BTC_VISUAL_COLORS.clarity,
    },
    {
      id: "memory-cells",
      label: "Memory Cells",
      signal: "volume + volatility",
      meaning: "Cell size, brightness and shape show how active or unstable that moment was.",
      color: BTC_VISUAL_COLORS.recovery,
    },
    {
      id: "semantic-tethers",
      label: "Semantic Tethers",
      signal: "pressure toward core",
      meaning: "Lines connecting cells to the BTC core show how strongly a memory point affects the live market state.",
      color: BTC_VISUAL_COLORS.volatilitySoft,
    },
    {
      id: "liquidity-rivers",
      label: "Liquidity Rivers",
      signal: "liquidity",
      meaning: "Smooth cyan flow indicates market continuity and less fragmented pressure.",
      color: BTC_VISUAL_COLORS.liquidity,
    },
    {
      id: "risk-fractures",
      label: "Risk Fractures",
      signal: "risk + contraction",
      meaning: "Sharp red cells and scars indicate contraction, stress and possible instability.",
      color: BTC_VISUAL_COLORS.risk,
    },
    {
      id: "financial-terrain",
      label: "Financial Terrain",
      signal: "volatility texture",
      meaning: "The background surface bends and roughens when the market becomes less stable.",
      color: BTC_VISUAL_COLORS.volatility,
    },
  ];
}

export function buildBTCVisualState({ pulse, history } = {}) {
  const signals = normalizeSignals(pulse || {});
  const historyPoints = getHistoryPoints(history);
  const mood = getBTCMood(signals);

  const baseState = {
    colors: BTC_VISUAL_COLORS,
    pulse: pulse || {},
    history: history || {},
    historyPoints,
    historyRange: history?.range || "live",
    pointCount: historyPoints.length,
    anomalyCount: Array.isArray(history?.anomalies) ? history.anomalies.length : 0,
    signals,
    mood,
    summary: buildReadingSummary(signals, mood),

    price: signals.price,
    change: signals.change,
    changePercent: signals.changePercent,
    volatility: signals.volatility,
    liquidity: signals.liquidity,
    risk: signals.risk,
    volume: signals.volume,
    health: signals.health,

    core: mapCoreVisuals(signals),
    spine: mapPriceSpineVisuals(signals),
    terrain: mapTerrainVisuals(signals),
    legend: buildVisualLegend(),
  };

  const priceSpine = createPriceSpinePoints(baseState, 180);
  const terrainLines = createFinancialTerrainLines(baseState);
  const liquidityRivers = createLiquidityRiverLines(baseState);
  const memoryCells = createMemoryCells(baseState);
  const semanticTethers = createSemanticTethers(baseState, memoryCells);
  const volatilityScars = createVolatilityScars(baseState, memoryCells);
  const atmosphereParticles = createAtmosphereParticles(
    baseState,
    Math.round(1400 + signals.volume * 1800 + signals.volatility * 700)
  );

  return {
    ...baseState,
    geometry: {
      priceSpine,
      terrainLines,
      liquidityRivers,
      memoryCells,
      semanticTethers,
      volatilityScars,
      atmosphereParticles,
    },
  };
}

export default buildBTCVisualState;