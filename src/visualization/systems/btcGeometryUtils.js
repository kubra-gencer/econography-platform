import * as THREE from "three";
import {
  clamp01,
  mapMemoryCellVisuals,
  mapTetherVisuals,
} from "./btcVisualMappings";

export function seeded(seed) {
  const value = Math.sin(seed * 999.13) * 43758.5453123;
  return value - Math.floor(value);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0), 0);
  return t * t * (3 - 2 * t);
}

export function getHistoryPoints(history) {
  return Array.isArray(history?.points) ? history.points : [];
}

export function getHistorySample(historyPoints, progress) {
  if (!historyPoints.length) {
    return {
      index: 0,
      progress,
      price: 0,
      priceNormalized: 0.5,
      volumeNormalized: 0.5,
      localVolatility: 0.35,
      direction: 1,
      timestamp: null,
    };
  }

  const safeProgress = clamp01(progress, 0);
  const rawIndex = safeProgress * (historyPoints.length - 1);
  const indexA = Math.floor(rawIndex);
  const indexB = Math.min(historyPoints.length - 1, indexA + 1);
  const mix = rawIndex - indexA;
  const a = historyPoints[indexA] || historyPoints[0];
  const b = historyPoints[indexB] || a;

  return {
    ...a,
    index: a.index ?? indexA,
    progress: safeProgress,
    price: lerp(Number(a.price) || 0, Number(b.price) || Number(a.price) || 0, mix),
    priceNormalized: lerp(
      clamp01(a.priceNormalized, 0.5),
      clamp01(b.priceNormalized, clamp01(a.priceNormalized, 0.5)),
      mix
    ),
    volumeNormalized: lerp(
      clamp01(a.volumeNormalized, 0.5),
      clamp01(b.volumeNormalized, clamp01(a.volumeNormalized, 0.5)),
      mix
    ),
    localVolatility: lerp(
      clamp01(a.localVolatility, 0.32),
      clamp01(b.localVolatility, clamp01(a.localVolatility, 0.32)),
      mix
    ),
    direction: Math.sign((Number(b.price) || 0) - (Number(a.price) || 0)) || Number(a.direction) || 1,
    timestamp: a.timestamp || b.timestamp || null,
  };
}

export function getPriceSpinePosition(visualState, progress, laneOffset = 0, depthOffset = 0) {
  const sample = getHistorySample(visualState.historyPoints, progress);
  const p = clamp01(progress, 0);

  const price = clamp01(sample.priceNormalized, 0.5);
  const volume = clamp01(sample.volumeNormalized, 0.5);
  const localVolatility = clamp01(sample.localVolatility, 0.32);

  const x = lerp(-3.55, 3.55, p);
  const centerWeight = Math.sin(p * Math.PI);
  const trendHeight = (price - 0.5) * (1.35 + visualState.volatility * 0.58);

  const volatilityWave =
    Math.sin(p * Math.PI * 8.5 + visualState.volatility * 1.7) * localVolatility * 0.19 +
    Math.sin(p * Math.PI * 17.0) * visualState.volatility * 0.035;

  const liquidityCurve = Math.sin(p * Math.PI * 2.1) * visualState.liquidity * 0.12;
  const compression = visualState.risk * centerWeight * -0.18;

  const y = trendHeight + volatilityWave + liquidityCurve + laneOffset;
  const z =
    0.24 +
    centerWeight * (0.68 + volume * 0.42) +
    localVolatility * 0.2 +
    compression +
    depthOffset;

  return new THREE.Vector3(x, y, z);
}

export function createPriceSpinePoints(visualState, segments = 180) {
  const points = [];

  for (let i = 0; i < segments; i++) {
    const progress = i / Math.max(1, segments - 1);
    points.push(getPriceSpinePosition(visualState, progress));
  }

  return points;
}

export function createFinancialTerrainLines(visualState) {
  const lines = [];
  const lineCount = visualState.terrain.lineCount;
  const segmentCount = 120;

  for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
    const laneProgress = lineIndex / Math.max(1, lineCount - 1);
    const laneOffset = (laneProgress - 0.5) * (1.85 + visualState.volume * 0.75);
    const points = [];

    for (let i = 0; i < segmentCount; i++) {
      const progress = i / Math.max(1, segmentCount - 1);
      const sample = getHistorySample(visualState.historyPoints, progress);
      const localVolatility = clamp01(sample.localVolatility, 0.32);
      const volume = clamp01(sample.volumeNormalized, 0.5);
      const centerWeight = Math.sin(progress * Math.PI);

      const base = getPriceSpinePosition(
        visualState,
        progress,
        laneOffset * 0.42,
        -0.58 - laneProgress * 0.2
      );

      const terrainWave =
        Math.sin(progress * Math.PI * (3.2 + visualState.volatility * 3.6) + laneProgress * Math.PI * 4.0) *
        visualState.terrain.amplitude *
        (0.22 + centerWeight * 0.88);

      base.y += terrainWave + (volume - 0.5) * 0.18;
      base.z -= Math.abs(laneOffset) * 0.22 + localVolatility * 0.18;

      points.push(base);
    }

    lines.push({
      points,
      phase: laneProgress,
      opacity: 0.035 + visualState.liquidity * 0.05 + visualState.volatility * 0.035,
      width: 0.12 + visualState.volume * 0.22 + laneProgress * 0.08,
    });
  }

  return lines;
}

export function createLiquidityRiverLines(visualState) {
  const lines = [];
  const lineCount = Math.round(8 + visualState.liquidity * 18);
  const segmentCount = 110;

  for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
    const lane = lineIndex / Math.max(1, lineCount - 1);
    const side = lineIndex % 2 === 0 ? 1 : -1;
    const laneOffset = side * (0.26 + lane * 0.9) * visualState.liquidity;
    const points = [];

    for (let i = 0; i < segmentCount; i++) {
      const progress = i / Math.max(1, segmentCount - 1);
      const sample = getHistorySample(visualState.historyPoints, progress);
      const volume = clamp01(sample.volumeNormalized, 0.5);
      const flowWave = Math.sin(progress * Math.PI * 4.4 + lane * Math.PI * 3.0) * 0.08 * visualState.liquidity;

      const point = getPriceSpinePosition(
        visualState,
        progress,
        laneOffset + flowWave,
        0.12 + lane * 0.18 + volume * 0.1
      );

      point.y += Math.sin(progress * Math.PI * 2.0 + lane * Math.PI) * 0.12 * visualState.liquidity;
      points.push(point);
    }

    lines.push({
      points,
      phase: lane,
      opacity: 0.065 + visualState.liquidity * 0.16,
      width: 0.12 + visualState.liquidity * 0.42 + lane * 0.1,
    });
  }

  return lines;
}

export function createMemoryCells(visualState) {
  const historyPoints = visualState.historyPoints;
  const cellCount = Math.min(96, Math.max(18, Math.round(36 + historyPoints.length * 0.22)));
  const cells = [];

  for (let i = 0; i < cellCount; i++) {
    const progress = i / Math.max(1, cellCount - 1);
    const sample = getHistorySample(historyPoints, progress);
    const cellVisual = mapMemoryCellVisuals(sample, visualState.signals);

    const spread = 0.18 + cellVisual.activity * 0.52 + cellVisual.instability * 0.36;
    const laneDirection = seeded(i + 12) > 0.5 ? 1 : -1;
    const laneOffset = laneDirection * seeded(i + 33) * spread;
    const depthOffset = (seeded(i + 44) - 0.5) * (0.22 + cellVisual.instability * 0.32);
    const position = getPriceSpinePosition(visualState, progress, laneOffset, depthOffset);

    cells.push({
      id: `btc-cell-${i}`,
      point: sample,
      visual: cellVisual,
      progress,
      position,
      laneOffset,
      depthOffset,
    });
  }

  return cells;
}

export function createSemanticTethers(visualState, cells) {
  const core = new THREE.Vector3(0, 0.03, 0.78);
  const importantCells = [...cells]
    .sort((a, b) => {
      const scoreA = a.visual.activity + a.visual.instability + (a.visual.highRisk ? 1 : 0);
      const scoreB = b.visual.activity + b.visual.instability + (b.visual.highRisk ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, Math.round(18 + visualState.volume * 10 + visualState.risk * 8));

  return importantCells.map((cell, index) => {
    const tetherVisual = mapTetherVisuals(cell.visual, visualState.signals);
    const source = cell.position.clone();
    const target = core.clone();
    const mid = source.clone().lerp(target, 0.46 + tetherVisual.tension * 0.12);

    const curveLift = 0.15 + tetherVisual.curvature * 0.48;
    const lateral = new THREE.Vector3(-source.y, source.x, 0).normalize().multiplyScalar((seeded(index + 91) - 0.5) * 0.35);

    mid.y += curveLift * (cell.visual.highRisk ? -0.35 : 0.5);
    mid.z += 0.2 + tetherVisual.tension * 0.34;
    mid.add(lateral);

    return {
      id: `btc-tether-${index}`,
      cell,
      visual: tetherVisual,
      points: [source, mid, target],
    };
  });
}

export function createVolatilityScars(visualState, cells) {
  return cells
    .filter((cell) => cell.visual.highRisk || cell.visual.highVolatility)
    .slice(0, 18)
    .map((cell, index) => {
      const radial = cell.position.clone().sub(new THREE.Vector3(0, 0, 0.6)).normalize();
      const tangent = new THREE.Vector3(-radial.y, radial.x, 0).normalize();
      const intensity = 0.12 + cell.visual.instability * 0.42 + visualState.risk * 0.18;

      return {
        id: `btc-scar-${index}`,
        color: cell.visual.highRisk ? visualState.colors.risk : visualState.colors.volatility,
        opacity: 0.16 + cell.visual.instability * 0.34,
        width: 0.28 + cell.visual.instability * 0.82,
        points: [
          cell.position.clone().add(tangent.clone().multiplyScalar(-intensity)),
          cell.position.clone().add(radial.clone().multiplyScalar(intensity * 0.8)),
          cell.position.clone().add(tangent.clone().multiplyScalar(intensity * 1.25)),
        ],
      };
    });
}

export function createAtmosphereParticles(visualState, count = 1800) {
  const array = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const band = seeded(i + 101);
    const angle = seeded(i + 202) * Math.PI * 2;
    const radius = 2.4 + seeded(i + 303) * (3.6 + visualState.volume * 1.8);
    const height = (seeded(i + 404) - 0.5) * (2.6 + visualState.volatility * 1.8);

    array[i * 3] = Math.cos(angle) * radius + (band - 0.5) * 0.7;
    array[i * 3 + 1] = height;
    array[i * 3 + 2] = Math.sin(angle) * radius - 1.2 + seeded(i + 505) * 1.8;
  }

  return array;
}