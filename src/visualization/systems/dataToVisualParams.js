export function dataToVisualParams(entity = {}, pulse = {}) {
  const normalize = (value, fallback = 50) => {
    if (typeof value !== "number" || Number.isNaN(value)) return fallback / 100;
    return value > 1 ? value / 100 : value;
  };

  const clamp01 = (value) => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * clamp01(t);

  const volatility = clamp01(normalize(entity.volatility ?? pulse.volatility, 46));
  const liquidity = clamp01(normalize(entity.liquidity ?? pulse.liquidity, 58));
  const risk = clamp01(normalize(entity.risk ?? pulse.risk, 28));
  const volume = clamp01(normalize(entity.volume ?? pulse.volume ?? entity.density, 62));
  const health = clamp01(normalize(entity.health ?? pulse.health, 72));

  let mood = entity.mood || pulse.mood || "stable";

  if (typeof mood === "string") {
    mood = mood.toLowerCase();
  }

  const moodPalette = {
    stable: {
      primary: "#dfe7ff",
      secondary: "#8ba3ff",
      accent: "#f4f1ea",
      terrain: "#9fb6ff",
      heat: "#f4f1ea",
      fracture: "#ff6a6a",
    },
    liquid: {
      primary: "#f4f1ea",
      secondary: "#8ba3ff",
      accent: "#ffcc82",
      terrain: "#72e7ff",
      heat: "#ffcc82",
      fracture: "#ff6a6a",
    },
    dense: {
      primary: "#f4f1ea",
      secondary: "#ffcc82",
      accent: "#8ba3ff",
      terrain: "#ffb15f",
      heat: "#ff7a28",
      fracture: "#ff4d5f",
    },
    volatile: {
      primary: "#ffe7d6",
      secondary: "#ff6a6a",
      accent: "#8ba3ff",
      terrain: "#ff8a3d",
      heat: "#ffcc82",
      fracture: "#ff314f",
    },
  };

  const palette =
    moodPalette[mood] ||
    (risk > 0.62
      ? moodPalette.volatile
      : liquidity > 0.72
      ? moodPalette.liquid
      : volume > 0.74
      ? moodPalette.dense
      : moodPalette.stable);

  const fieldIntensity = clamp01(0.28 + liquidity * 0.34 + volume * 0.28 + volatility * 0.18);
  const waveAmplitude = mix(0.12, 0.72, volatility * 0.72 + risk * 0.28);
  const waveFrequency = mix(1.4, 4.8, volume * 0.68 + volatility * 0.32);
  const terrainDensity = Math.round(mix(18, 46, volume * 0.62 + liquidity * 0.38));
  const terrainResolution = Math.round(mix(96, 170, volume * 0.45 + liquidity * 0.35 + volatility * 0.2));
  const fieldCompression = mix(0.74, 1.34, volume);
  const flowContinuity = clamp01(0.42 + liquidity * 0.58 - risk * 0.2);
  const fractureIntensity = clamp01(risk * 0.72 + volatility * 0.28);
  const heatBloom = clamp01(0.18 + health * 0.22 + liquidity * 0.22 + volume * 0.18);
  const grainIntensity = clamp01(0.18 + volume * 0.35 + volatility * 0.22 + risk * 0.18);

  return {
    volatility,
    liquidity,
    risk,
    volume,
    health,

    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    accentColor: palette.accent,
    terrainColor: palette.terrain,
    heatColor: palette.heat,
    fractureColor: palette.fracture,

    particleCount: Math.round(2600 + volume * 3200),
    dustCount: Math.round(1200 + liquidity * 900),
    flowCount: Math.round(900 + volume * 1100),

    speed: 0.018 + volatility * 0.06,
    turbulence: 0.12 + volatility * 0.72 + risk * 0.48,
    distortion: 0.08 + risk * 0.7,
    coherence: clamp01(0.62 + liquidity * 0.35 - risk * 0.16),
    glow: 0.05 + health * 0.12 + liquidity * 0.08,
    pressure: 0.9 + volume * 0.42,

    fieldIntensity,
    waveAmplitude,
    waveFrequency,
    terrainDensity,
    terrainResolution,
    fieldCompression,
    flowContinuity,
    fractureIntensity,
    heatBloom,
    grainIntensity,
  };
}