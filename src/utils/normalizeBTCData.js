function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalize01(value, min, max) {
  if (!Number.isFinite(value) || max === min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function calculateVolatility(change24h) {
  const absChange = Math.abs(change24h);

  // BTC için 24h değişimde:
  // 0.2% = çok sakin
  // 8%+ = yüksek oynaklık
  return normalize01(absChange, 0.2, 8);
}

function calculateVolumeSignal(volume24h) {
  // BTC günlük hacmi dönem dönem çok değişir.
  // Burada görsel yoğunluk için normalize edilmiş pratik aralık kullanıyoruz.
  return normalize01(volume24h, 8_000_000_000, 80_000_000_000);
}

function calculateLiquiditySignal({ volumeSignal, volatility, change24h }) {
  const directionPenalty = change24h < 0 ? 0.08 : 0;
  const volatilityPenalty = volatility * 0.32;

  // Volume yüksekse liquidity hissi artar.
  // Volatility çok yüksekse akış daha az smooth görünür.
  return clamp(
    0.48 + volumeSignal * 0.42 - volatilityPenalty - directionPenalty,
    0.16,
    0.94
  );
}

function calculateRiskSignal({ volatility, change24h, volumeSignal }) {
  const absChange = Math.abs(change24h);

  const downsideRisk =
    change24h < 0 ? normalize01(absChange, 0.4, 7.5) : 0.08;

  const volatilityRisk = volatility * 0.5;

  // Volume çok düşükse piyasa daha kırılgan okunur.
  const thinMarketRisk = (1 - volumeSignal) * 0.18;

  return clamp(
    downsideRisk * 0.42 + volatilityRisk + thinMarketRisk,
    0.06,
    0.95
  );
}

function getMood({ volatility, liquidity, risk, volumeSignal, change24h }) {
  if (risk > 0.76) return "Distortion Field";
  if (risk > 0.62 && change24h < 0) return "Stress Trace";
  if (volatility > 0.76 && change24h > 0) return "Expansion Surge";
  if (volatility > 0.76 && change24h < 0) return "Contraction Shock";
  if (liquidity > 0.72 && risk < 0.38) return "Liquid Harmony";
  if (volumeSignal > 0.72 && volatility < 0.55) return "Density Bloom";
  if (change24h > 2.5) return "Expansion Bloom";
  if (change24h < -2.5) return "Contraction Trace";

  return "Balanced Flow";
}

function getInterpretation({ mood, change24h, volatility, liquidity, risk }) {
  if (mood === "Liquid Harmony") {
    return "High liquidity and controlled risk create a smoother memory orbit.";
  }

  if (mood === "Distortion Field") {
    return "Elevated risk pressure introduces fracture, halo and unstable orbit behavior.";
  }

  if (mood === "Expansion Surge" || mood === "Expansion Bloom") {
    return "Positive market movement expands the memory field and increases visual energy.";
  }

  if (mood === "Contraction Shock" || mood === "Contraction Trace") {
    return "Negative market movement compresses the orbit and increases stress in the field.";
  }

  if (mood === "Density Bloom") {
    return "High transaction activity produces denser particles around the market core.";
  }

  if (risk > 0.55) {
    return "Risk pressure is visible as distortion around the memory structure.";
  }

  if (liquidity > 0.65) {
    return "Liquidity stabilizes the orbit and creates smoother continuity.";
  }

  if (volatility > 0.6) {
    return "Volatility bends the trace and increases market turbulence.";
  }

  return "The market memory remains balanced, with moderate movement and stable visual rhythm.";
}

export function normalizeBTCData(marketPayload) {
  const raw = marketPayload?.raw || {};

  const price = safeNumber(raw.usd, 0);
  const marketCap = safeNumber(raw.usd_market_cap, 0);
  const volume24h = safeNumber(raw.usd_24h_vol, 0);
  const change24h = safeNumber(raw.usd_24h_change, 0);
  const lastUpdatedAt = safeNumber(
    raw.last_updated_at,
    Math.floor(Date.now() / 1000)
  );

  const volatility = calculateVolatility(change24h);
  const volume = calculateVolumeSignal(volume24h);

  const liquidity = calculateLiquiditySignal({
    volumeSignal: volume,
    volatility,
    change24h,
  });

  const risk = calculateRiskSignal({
    volatility,
    change24h,
    volumeSignal: volume,
  });

  const mood = getMood({
    volatility,
    liquidity,
    risk,
    volumeSignal: volume,
    change24h,
  });

  const interpretation = getInterpretation({
    mood,
    change24h,
    volatility,
    liquidity,
    risk,
  });

  return {
    // Raw market facts
    price,
    marketCap,
    volume24h,
    change24h,
    lastUpdatedAt,

    // Source state
    isLive: marketPayload?.isLive ?? false,
    source: marketPayload?.source ?? "unknown",

    // Econography visual signals
    volatility,
    liquidity,
    risk,
    volume,
    density: volume,
    mood,
    interpretation,

    // Semantic mapping labels
    visualMapping: {
      price: "orbit anchor",
      volume: "particle density",
      change24h: "market mood",
      volatility: "orbit turbulence",
      liquidity: "flow continuity",
      risk: "distortion pressure",
    },
  };
}