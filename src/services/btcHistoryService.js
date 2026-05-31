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

    const basePrice = isCustomDate ? 0 : 107000;
    const slowWave = Math.sin(progress * Math.PI * 2.2) * 2600;
    const fastWave = Math.sin(progress * Math.PI * 13.5) * 850;
    const stressWave = Math.cos(progress * Math.PI * 8.3) * 420;
    const dateShift = isCustomDate
      ? Math.sin((start / 86_400_000) * Math.PI * 0.17) * 1800
      : 0;
    const price = basePrice > 0 ? basePrice + dateShift + slowWave + fastWave + stressWave : 0;

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
    selectedDate: isCustomDate ? options.date : null,
    prices,
    market_caps,
    total_volumes,
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
      selectedDate: hasCustomDate ? options.date : null,
      prices: data.prices,
      market_caps: data.market_caps,
      total_volumes: data.total_volumes,
      raw: data,
    };
  } catch (error) {
    console.warn("Using fallback BTC history data:", error);
    return createFallbackHistory(range, options);
  }
}

export async function fetchBTCHistoryByDate(dateValue, windowDays = 1) {
  const date = new Date(`${dateValue}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid BTC historical date: ${dateValue}`);
  }

  const halfWindow = Math.max(0.5, Number(windowDays) || 1) * 24 * 60 * 60 * 1000;
  const from = Math.floor((date.getTime() - halfWindow) / 1000);
  const to = Math.floor((date.getTime() + halfWindow) / 1000);

  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}&precision=full`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`BTC historical date request failed: ${response.status}`);
  }

  const payload = await response.json();

  if (!Array.isArray(payload?.prices) || payload.prices.length === 0) {
    throw new Error("BTC historical date response did not include prices.");
  }

  return {
    source: "coingecko-historical-date",
    isLive: true,
    range: dateValue,
    mode: "historical-date",
    selectedDate: dateValue,
    from,
    to,
    prices: payload.prices,
    market_caps: payload.market_caps,
    total_volumes: payload.total_volumes,
    raw: payload,
  };
}