export const ECONOGRAPHY_COLORS = {
  // Core neutrals — premium financial night
  deepSpace: "#02040A",
  voidBlack: "#030509",
  graphite: "#090D15",
  inkBlue: "#071526",

  // Price / analytical path — warm ivory, not neon white
  pearl: "#EFE4D2",
  moonSilver: "#C9D8E8",
  coldSilver: "#91A8C2",

  // Liquidity / flow — muted blue-cyan
  liquidityBlue: "#355A9A",
  liquidityCyan: "#4AA8B8",
  electricCyan: "#72C9D2",
  deepSapphire: "#203A78",

  // Memory / archive — deep violet residue
  memoryViolet: "#5946A3",
  liquidViolet: "#715AB8",
  deepViolet: "#2E246E",

  // Volume / archival echo — champagne and aged gold
  archivalWhite: "#EAD8B8",
  archivalGold: "#B8893D",
  champagne: "#D8B778",
  softAmber: "#A96F31",

  // Volatility / fracture — wine red / muted rose
  volatilityPink: "#8A2638",
  volatilityViolet: "#7442A6",
  electricViolet: "#5748A6",

  // Risk / contraction — deep realistic crimson
  riskRed: "#5E0B16",
  riskCoral: "#8A1B24",
  riskAmber: "#A46E32",
  ember: "#35050C",
};

export function clamp01(value, fallback = 0.5) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(1, Math.max(0, number));
}

export function getMarketSignals(pulse) {
  return {
    volatility: clamp01(pulse?.volatility, 0.45),
    liquidity: clamp01(pulse?.liquidity, 0.55),
    risk: clamp01(pulse?.risk, 0.25),
    volume: clamp01(pulse?.volume, 0.55),
  };
}

export function getMarketPalette(pulse) {
  const { volatility, liquidity, risk, volume } = getMarketSignals(pulse);

  const dominantState = getDominantMarketState({
    volatility,
    liquidity,
    risk,
    volume,
  });

  const base = {
    dominantState,
    background: ECONOGRAPHY_COLORS.deepSpace,
    archival: ECONOGRAPHY_COLORS.archivalWhite,
    archivalAccent: ECONOGRAPHY_COLORS.archivalGold,
  };

  if (dominantState === "risk") {
    return {
      ...base,
      primary: ECONOGRAPHY_COLORS.riskCoral,
      secondary: ECONOGRAPHY_COLORS.riskAmber,
      accent: ECONOGRAPHY_COLORS.champagne,
      atmosphere: ECONOGRAPHY_COLORS.ember,
      orbit: ECONOGRAPHY_COLORS.riskAmber,
      particles: ECONOGRAPHY_COLORS.champagne,
      fracture: ECONOGRAPHY_COLORS.riskRed,
      halo: ECONOGRAPHY_COLORS.riskRed,
      ghost: ECONOGRAPHY_COLORS.memoryViolet,
      core: ECONOGRAPHY_COLORS.inkBlue,
    };
  }

  if (dominantState === "volatility") {
    return {
      ...base,
      primary: ECONOGRAPHY_COLORS.volatilityPink,
      secondary: ECONOGRAPHY_COLORS.electricViolet,
      accent: ECONOGRAPHY_COLORS.archivalGold,
      atmosphere: ECONOGRAPHY_COLORS.volatilityViolet,
      orbit: ECONOGRAPHY_COLORS.pearl,
      particles: ECONOGRAPHY_COLORS.champagne,
      fracture: ECONOGRAPHY_COLORS.volatilityPink,
      halo: ECONOGRAPHY_COLORS.riskCoral,
      ghost: ECONOGRAPHY_COLORS.liquidViolet,
      core: ECONOGRAPHY_COLORS.deepViolet,
    };
  }

  if (dominantState === "liquidity") {
    return {
      ...base,
      primary: ECONOGRAPHY_COLORS.electricCyan,
      secondary: ECONOGRAPHY_COLORS.liquidityBlue,
      accent: ECONOGRAPHY_COLORS.archivalGold,
      atmosphere: ECONOGRAPHY_COLORS.liquidViolet,
      orbit: ECONOGRAPHY_COLORS.moonSilver,
      particles: ECONOGRAPHY_COLORS.champagne,
      fracture: ECONOGRAPHY_COLORS.riskCoral,
      halo: ECONOGRAPHY_COLORS.deepSapphire,
      ghost: ECONOGRAPHY_COLORS.memoryViolet,
      core: ECONOGRAPHY_COLORS.inkBlue,
    };
  }

  return {
    ...base,
    primary: ECONOGRAPHY_COLORS.moonSilver,
    secondary: ECONOGRAPHY_COLORS.liquidityCyan,
    accent: ECONOGRAPHY_COLORS.archivalGold,
    atmosphere: ECONOGRAPHY_COLORS.deepViolet,
    orbit: ECONOGRAPHY_COLORS.pearl,
    particles: ECONOGRAPHY_COLORS.champagne,
    fracture: ECONOGRAPHY_COLORS.riskCoral,
    halo: ECONOGRAPHY_COLORS.deepSapphire,
    ghost: ECONOGRAPHY_COLORS.liquidViolet,
    core: ECONOGRAPHY_COLORS.inkBlue,
  };
}

function getDominantMarketState({ volatility, liquidity, risk, volume }) {
  if (risk > 0.62 && liquidity < 0.52) return "risk";
  if (risk > 0.7) return "risk";
  if (volatility > 0.66) return "volatility";
  if (volume > 0.72 && volatility > 0.5) return "volatility";
  if (liquidity > 0.52 && risk < 0.58) return "liquidity";
  return "balanced";
}

export function getSemanticColor(pulse, role = "primary") {
  const palette = getMarketPalette(pulse);
  return palette[role] || palette.primary;
}