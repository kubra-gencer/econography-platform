const RANGE_TO_DAYS = {
  "1D": 1,
  "7D": 7,
  "30D": 30,
};

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

function getCoinGeckoHistoryUrl(range = "7D") {
  const days = RANGE_TO_DAYS[range] || RANGE_TO_DAYS["7D"];

  return (
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart" +
    `?vs_currency=usd&days=${days}` +
    "&precision=full"
  );
}

function getCoinGeckoHistoricalRangeUrl(date) {
  const selectedDate = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(selectedDate.getTime())) {
    throw new Error("Invalid custom BTC history date.");
  }

  const from = Math.floor(selectedDate.getTime() / 1000);
  const to = from + ONE_DAY_IN_SECONDS;

  return (
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range" +
    `?vs_currency=usd&from=${from}&to=${to}` +
    "&precision=full"
  );
}

function createFallbackHistory(range = "7D", options = {}) {
  const isCustomDate = Boolean(options.date);
  const days = isCustomDate ? 1 : RANGE_TO_DAYS[range] || RANGE_TO_DAYS["7D"];
  const pointCount = isCustomDate
    ? 144
    : range === "1D"
    ? 96
    : range === "7D"
    ? 168
    : 240;

  const customStart = isCustomDate
    ? new Date(`${options.date}T00:00:00Z`).getTime()
    : null;

  const now = Date.now();
  const start = Number.isFinite(customStart)
    ? customStart
    : now - days * 24 * 60 * 60 * 1000;
  const end = start + days * 24 * 60 * 60 * 1000;

  const prices = [];
  const market_caps = [];
  const total_volumes = [];

  for (let i = 0; i < pointCount; i++) {
    const progress = i / Math.max(1, pointCount - 1);
    const timestamp = start + progress * (end - start);

    const basePrice = 107000;
    const slowWave = Math.sin(progress * Math.PI * 2.2) * 2600;
    const fastWave = Math.sin(progress * Math.PI * 13.5) * 850;
    const stressWave = Math.cos(progress * Math.PI * 8.3) * 420;
    const dateShift = isCustomDate
      ? Math.sin((start / 86_400_000) * Math.PI * 0.17) * 1800
      : 0;
    const price = basePrice + dateShift + slowWave + fastWave + stressWave;

    const volume =
      32_000_000_000 +
      Math.abs(Math.sin(progress * Math.PI * 5.5)) * 22_000_000_000 +
      Math.abs(Math.cos(progress * Math.PI * 19)) * 5_000_000_000;

    prices.push([timestamp, price]);
    market_caps.push([timestamp, price * 19_700_000]);
    total_volumes.push([timestamp, volume]);
  }

  return {
    source: isCustomDate ? "fallback-historical-date" : "fallback-history",
    isLive: false,
    range: isCustomDate ? options.date : range,
    mode: isCustomDate ? "historical-date" : "range",
    raw: {
      prices,
      market_caps,
      total_volumes,
    },
  };
}

export async function fetchBTCHistoryData(range = "7D", options = {}) {
  const hasCustomDate = Boolean(options?.date);

  try {
    const url = hasCustomDate
      ? getCoinGeckoHistoricalRangeUrl(options.date)
      : getCoinGeckoHistoryUrl(range);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko history request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data?.prices) || data.prices.length === 0) {
      throw new Error("CoinGecko history response did not include prices.");
    }

    return {
      source: hasCustomDate
        ? "coingecko-historical-range"
        : "coingecko-history",
      isLive: true,
      range: hasCustomDate ? options.date : range,
      mode: hasCustomDate ? "historical-date" : "range",
      raw: data,
    };
  } catch (error) {
    console.warn("Using fallback BTC history data:", error);
    return createFallbackHistory(range, options);
  }
}