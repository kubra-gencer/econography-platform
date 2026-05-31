

export const BTC_VISUAL_COLORS = {
  deepSpace: "#02040A",
  voidBlue: "#050914",

  liquidity: "#6FEAFF",
  liquiditySoft: "#BDF7FF",
  liquidityDeep: "#1BA8C8",

  recovery: "#FFC76A",
  recoverySoft: "#FFE0A3",
  recoveryDeep: "#C77824",

  risk: "#FF3158",
  riskSoft: "#FF7B92",
  riskDeep: "#7C0E1A",

  volatility: "#8F7BFF",
  volatilitySoft: "#C8BEFF",
  volatilityDeep: "#3D2A8A",

  clarity: "#EAFBFF",
  archive: "#6C7890",
};

export const BTC_CELL_SHAPES = {
  STABLE: "stable-sphere",
  ACTIVE: "active-orb",
  RECOVERY: "recovery-crystal",
  RISK: "risk-fracture",
  VOLATILE: "volatile-shard",
};

export function clamp01(value, fallback = 0.5) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function safeNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function getBTCMood(signals) {
  const risk = clamp01(signals?.risk, 0.25);
  const volatility = clamp01(signals?.volatility, 0.35);
  const liquidity = clamp01(signals?.liquidity, 0.55);
  const volume = clamp01(signals?.volume, 0.5);
  const change = safeNumber(signals?.change, 0);

  if (risk > 0.66 && volatility > 0.52) {
    return {
      id: "stress-field",
      label: "Stress Field",
      tone: "risk",
      color: BTC_VISUAL_COLORS.risk,
      description: "Risk and volatility are compressing the memory field.",
    };
  }

  if (volatility > 0.66) {
    return {
      id: "volatile-memory",
      label: "Volatile Memory",
      tone: "volatility",
      color: BTC_VISUAL_COLORS.volatility,
      description: "The market is readable but unstable and highly distorted.",
    };
  }

  if (change > 0 && volume > 0.56) {
    return {
      id: "recovery-pulse",
      label: "Recovery Pulse",
      tone: "recovery",
      color: BTC_VISUAL_COLORS.recovery,
      description: "Positive movement and activity are producing a warm recovery signal.",
    };
  }

  if (liquidity > 0.62 && risk < 0.48) {
    return {
      id: "liquid-harmony",
      label: "Liquid Harmony",
      tone: "liquidity",
      color: BTC_VISUAL_COLORS.liquidity,
      description: "Liquidity is keeping the financial memory smooth and coherent.",
    };
  }

  return {
    id: "balanced-flow",
    label: "Balanced Flow",
    tone: "balanced",
    color: BTC_VISUAL_COLORS.clarity,
    description: "The memory remains balanced, readable and moderately active.",
  };
}

export function mapCoreVisuals(signals) {
  const risk = clamp01(signals?.risk, 0.25);
  const volatility = clamp01(signals?.volatility, 0.35);
  const liquidity = clamp01(signals?.liquidity, 0.55);
  const volume = clamp01(signals?.volume, 0.5);
  const health = clamp01(signals?.health, 0.68);
  const change = safeNumber(signals?.change, 0);
  const mood = getBTCMood(signals);

  const isNegative = change < -0.001 || risk > liquidity + 0.18;
  const isPositive = change > 0.001 && liquidity >= risk;

  return {
    mood,
    color: isNegative
      ? BTC_VISUAL_COLORS.risk
      : isPositive
      ? BTC_VISUAL_COLORS.recovery
      : mood.color,
    innerColor: isNegative
      ? BTC_VISUAL_COLORS.riskSoft
      : isPositive
      ? BTC_VISUAL_COLORS.recoverySoft
      : BTC_VISUAL_COLORS.liquiditySoft,
    pulseSpeed: 0.45 + volatility * 1.55 + risk * 0.65,
    glow: 0.22 + liquidity * 0.32 + health * 0.22,
    compression: 0.08 + risk * 0.34,
    membraneOpacity: 0.08 + health * 0.1 + liquidity * 0.06,
    haloThickness: 0.006 + risk * 0.026 + volume * 0.012,
    btcSymbolOpacity: 0.48 + health * 0.32,
  };
}

export function mapPriceSpineVisuals(signals) {
  const risk = clamp01(signals?.risk, 0.25);
  const volatility = clamp01(signals?.volatility, 0.35);
  const liquidity = clamp01(signals?.liquidity, 0.55);
  const volume = clamp01(signals?.volume, 0.5);
  const change = safeNumber(signals?.change, 0);

  return {
    color: change < 0 || risk > 0.58 ? BTC_VISUAL_COLORS.riskSoft : BTC_VISUAL_COLORS.liquiditySoft,
    glowColor: volume > 0.58 ? BTC_VISUAL_COLORS.recovery : BTC_VISUAL_COLORS.liquidity,
    thickness: 0.38 + volume * 1.25,
    glowThickness: 2.4 + volume * 4.6,
    opacity: 0.58 + liquidity * 0.24,
    distortion: 0.08 + volatility * 0.48 + risk * 0.18,
    smoothness: 0.3 + liquidity * 0.7,
  };
}

export function mapMemoryCellVisuals(point, signals) {
  const risk = clamp01(signals?.risk, 0.25);
  const liquidity = clamp01(signals?.liquidity, 0.55);

  const activity = clamp01(point?.volumeNormalized, 0.5);
  const instability = clamp01(point?.localVolatility, 0.32);
  const direction = safeNumber(point?.direction, 1);
  const priceStrength = clamp01(point?.priceNormalized, 0.5);

  const isContraction = direction < 0;
  const highRisk = isContraction && (instability > 0.44 || risk > 0.58);
  const highRecovery = !isContraction && activity > 0.58 && liquidity >= risk;
  const highActivity = activity > 0.68;
  const highVolatility = instability > 0.66;

  let type = BTC_CELL_SHAPES.STABLE;
  let color = BTC_VISUAL_COLORS.liquidity;
  let meaning = "Stable memory: low stress and readable market activity.";

  if (highRisk) {
    type = BTC_CELL_SHAPES.RISK;
    color = BTC_VISUAL_COLORS.risk;
    meaning = highActivity
      ? "High-volume contraction: strong risk pressure with active participation."
      : "Low-activity contraction: risk appears, but participation is limited.";
  } else if (highVolatility) {
    type = BTC_CELL_SHAPES.VOLATILE;
    color = BTC_VISUAL_COLORS.volatility;
    meaning = "Volatile memory: the signal is distorted by unstable price movement.";
  } else if (highRecovery) {
    type = BTC_CELL_SHAPES.RECOVERY;
    color = BTC_VISUAL_COLORS.recovery;
    meaning = highActivity
      ? "Active recovery: positive movement is supported by strong activity."
      : "Soft recovery: improvement appears, but activity is still moderate.";
  } else if (highActivity) {
    type = BTC_CELL_SHAPES.ACTIVE;
    color = BTC_VISUAL_COLORS.recoverySoft;
    meaning = "Dense activity: volume thickens this memory point.";
  }

  return {
    type,
    color,
    meaning,
    activity,
    instability,
    priceStrength,
    size: 0.018 + activity * 0.042 + instability * 0.026,
    halo: 0.055 + activity * 0.13 + instability * 0.1,
    brightness: 0.28 + Math.max(activity, instability) * 0.56,
    dustDensity: 0.24 + activity * 0.58,
    sharpness: highRisk || highVolatility ? 0.7 + instability * 0.3 : 0.15 + activity * 0.28,
    ringOpacity: highActivity ? 0.16 + activity * 0.22 : 0.04 + liquidity * 0.08,
    isContraction,
    highRisk,
    highRecovery,
    highActivity,
    highVolatility,
  };
}

export function mapTetherVisuals(cellVisual, signals) {
  const risk = clamp01(signals?.risk, 0.25);
  const liquidity = clamp01(signals?.liquidity, 0.55);
  const volume = clamp01(signals?.volume, 0.5);

  const tension = cellVisual.highRisk
    ? 0.55 + risk * 0.45
    : cellVisual.highRecovery
    ? 0.38 + volume * 0.32
    : 0.18 + liquidity * 0.3;

  return {
    color: cellVisual.highRisk
      ? BTC_VISUAL_COLORS.risk
      : cellVisual.highRecovery || cellVisual.highActivity
      ? BTC_VISUAL_COLORS.recovery
      : BTC_VISUAL_COLORS.liquidity,
    opacity: cellVisual.highRisk
      ? 0.08 + risk * 0.22
      : cellVisual.highActivity
      ? 0.08 + volume * 0.18
      : 0.05 + liquidity * 0.14,
    width: cellVisual.highRisk
      ? 0.32 + risk * 0.95
      : cellVisual.highActivity
      ? 0.25 + volume * 0.74
      : 0.15 + liquidity * 0.52,
    curvature: 0.08 + liquidity * 0.34 - risk * 0.08,
    tension,
    meaning: cellVisual.highRisk
      ? "Tether tension shows risk pulling pressure toward the BTC core."
      : cellVisual.highRecovery
      ? "Recovery tether shows activity feeding energy back into the core."
      : "Liquidity tether shows smoother market continuity around the core.",
  };
}

export function mapTerrainVisuals(signals) {
  const volatility = clamp01(signals?.volatility, 0.35);
  const liquidity = clamp01(signals?.liquidity, 0.55);
  const risk = clamp01(signals?.risk, 0.25);
  const volume = clamp01(signals?.volume, 0.5);

  return {
    lineCount: Math.round(24 + volume * 20 + volatility * 12),
    amplitude: 0.18 + volatility * 0.72,
    density: 0.32 + volume * 0.56,
    compression: 0.08 + risk * 0.34,
    flowContinuity: 0.3 + liquidity * 0.68,
    grain: 0.15 + volume * 0.48 + volatility * 0.22,
  };
}

export function getVisualGrammarItems() {
  return [
    {
      title: "Price Spine",
      signal: "price trajectory",
      description: "The main luminous trace follows BTC history and acts as the organism's temporal backbone.",
      color: BTC_VISUAL_COLORS.clarity,
    },
    {
      title: "Cell Size",
      signal: "volume / activity",
      description: "Larger cells indicate stronger market activity around that memory point.",
      color: BTC_VISUAL_COLORS.recovery,
    },
    {
      title: "Red Fractures",
      signal: "risk / contraction",
      description: "Sharp red forms mark unstable or risk-heavy moments in the market field.",
      color: BTC_VISUAL_COLORS.risk,
    },
    {
      title: "Cyan Flow",
      signal: "liquidity",
      description: "Smooth cyan ribbons represent continuity and market flow around the BTC core.",
      color: BTC_VISUAL_COLORS.liquidity,
    },
    {
      title: "Semantic Tethers",
      signal: "pressure to core",
      description: "Lines from memory cells to the core reveal how historical points pull on the live market state.",
      color: BTC_VISUAL_COLORS.volatilitySoft,
    },
    {
      title: "Financial Terrain",
      signal: "volatility + density",
      description: "The terrain behaves like a market surface: calmer when coherent, sharper when volatile.",
      color: BTC_VISUAL_COLORS.volatility,
    },
  ];
}