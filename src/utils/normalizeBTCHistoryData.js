

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize01(value, min, max) {
  if (!Number.isFinite(value) || max === min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

function getMinMax(values) {
  if (!values.length) {
    return { min: 0, max: 1 };
  }

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    const number = safeNumber(value, 0);
    min = Math.min(min, number);
    max = Math.max(max, number);
  }

  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return { min: min || 0, max: (max || 0) + 1 };
  }

  return { min, max };
}

function sampleSeries(series, maxPoints = 260) {
  if (!Array.isArray(series)) return [];
  if (series.length <= maxPoints) return series;

  const sampled = [];
  const step = (series.length - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.round(i * step);
    sampled.push(series[index]);
  }

  return sampled;
}

function calculatePointVolatility(currentPrice, previousPrice, priceRange) {
  if (!previousPrice || !priceRange) return 0;

  const absoluteMove = Math.abs(currentPrice - previousPrice);
  return clamp(absoluteMove / priceRange, 0, 1);
}

export function normalizeBTCHistoryData(historyPayload, options = {}) {
  const raw = historyPayload?.raw || {};
  const range = historyPayload?.range || options.range || "7D";

  const rawPrices = Array.isArray(raw.prices) ? raw.prices : [];
  const rawVolumes = Array.isArray(raw.total_volumes) ? raw.total_volumes : [];

  const sampledPrices = sampleSeries(rawPrices, options.maxPoints || 260);

  const priceValues = sampledPrices.map((point) => safeNumber(point?.[1], 0));
  const { min: minPrice, max: maxPrice } = getMinMax(priceValues);
  const priceRange = Math.max(1, maxPrice - minPrice);

  const volumeByTimestamp = new Map(
    rawVolumes.map((point) => [safeNumber(point?.[0], 0), safeNumber(point?.[1], 0)])
  );

  const volumeValues = sampledPrices.map((point) => {
    const timestamp = safeNumber(point?.[0], 0);
    const directVolume = volumeByTimestamp.get(timestamp);

    if (Number.isFinite(directVolume)) return directVolume;

    const nearest = rawVolumes.reduce(
      (best, volumePoint) => {
        const volumeTimestamp = safeNumber(volumePoint?.[0], 0);
        const distance = Math.abs(volumeTimestamp - timestamp);

        if (!best || distance < best.distance) {
          return {
            distance,
            value: safeNumber(volumePoint?.[1], 0),
          };
        }

        return best;
      },
      null
    );

    return nearest?.value || 0;
  });

  const { min: minVolume, max: maxVolume } = getMinMax(volumeValues);

  const points = sampledPrices.map((point, index) => {
    const timestamp = safeNumber(point?.[0], 0);
    const price = safeNumber(point?.[1], 0);
    const previousPrice = index > 0 ? priceValues[index - 1] : price;
    const volume = volumeValues[index] || 0;

    const progress = sampledPrices.length <= 1 ? 0 : index / (sampledPrices.length - 1);
    const priceNormalized = normalize01(price, minPrice, maxPrice);
    const volumeNormalized = normalize01(volume, minVolume, maxVolume);
    const localVolatility = calculatePointVolatility(price, previousPrice, priceRange);
    const direction = price >= previousPrice ? 1 : -1;

    return {
      index,
      timestamp,
      price,
      volume,
      progress,
      priceNormalized,
      volumeNormalized,
      localVolatility,
      direction,
    };
  });

  const firstPrice = points[0]?.price || 0;
  const lastPrice = points[points.length - 1]?.price || firstPrice;
  const totalChange = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;

  const averageVolume =
    volumeValues.length > 0
      ? volumeValues.reduce((sum, value) => sum + safeNumber(value, 0), 0) / volumeValues.length
      : 0;

  const averageVolatility =
    points.length > 0
      ? points.reduce((sum, point) => sum + point.localVolatility, 0) / points.length
      : 0;

  const maxLocalVolatility = points.reduce(
    (max, point) => Math.max(max, point.localVolatility),
    0
  );

  const anomalies = points
    .filter((point) => point.localVolatility > Math.max(0.06, maxLocalVolatility * 0.72))
    .slice(0, 8)
    .map((point) => ({
      index: point.index,
      timestamp: point.timestamp,
      price: point.price,
      localVolatility: point.localVolatility,
      direction: point.direction,
    }));

  return {
    source: historyPayload?.source || "unknown-history",
    isLive: historyPayload?.isLive ?? false,
    range,
    points,
    stats: {
      minPrice,
      maxPrice,
      priceRange,
      firstPrice,
      lastPrice,
      totalChange,
      minVolume,
      maxVolume,
      averageVolume,
      averageVolatility,
      maxLocalVolatility,
      pointCount: points.length,
    },
    anomalies,
    visualMapping: {
      progress: "orbit angle / time position",
      priceNormalized: "radial displacement",
      volumeNormalized: "trace thickness / particle emission",
      localVolatility: "local turbulence / jitter",
      direction: "expansion or contraction polarity",
    },
  };
}