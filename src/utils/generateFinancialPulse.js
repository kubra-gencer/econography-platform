export function generateFinancialPulse() {
  const volatility = Math.random();
  const liquidity = Math.random();
  const risk = Math.random();
  const volume = Math.random();

  const latency = Math.floor(20 + Math.random() * 120);

  const price =
    108000 +
    Math.sin(Date.now() * 0.0002) * 2400 +
    Math.random() * 1200;

  const health = Math.max(
    12,
    Math.min(
      98,
      Math.round(
        100 -
          risk * 42 +
          liquidity * 26 +
          volume * 12
      )
    )
  );

  let mood = "Balanced Flow";

  if (risk > 0.72) {
    mood = "Distortion Field";
  } else if (volatility > 0.7) {
    mood = "Volatile Memory";
  } else if (liquidity > 0.76) {
    mood = "Liquid Harmony";
  }

  return {
    price: Math.round(price),

    volatility,
    liquidity,
    risk,
    volume,

    latency,
    health,
    mood,
  };
}