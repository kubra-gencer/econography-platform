import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";


function readHistoryPoints(history) {
  return Array.isArray(history?.points) ? history.points : [];
}

function smoothPointValue(points, index, key, radius = 3, fallback = 0) {
  let sum = 0;
  let weightSum = 0;

  for (let offset = -radius; offset <= radius; offset += 1) {
    const sample = points[index + offset];
    if (!sample) continue;

    const value = Number(sample[key]);
    if (!Number.isFinite(value)) continue;

    const weight = radius + 1 - Math.abs(offset);
    sum += value * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? sum / weightSum : fallback;
}
function getLegacyOrbitPoint(point, historyPoints, visualState) {
  const t = Number(point.progress) || point.index / Math.max(1, historyPoints.length - 1);
  const angle = t * Math.PI * 2;

  const smoothPrice = smoothPointValue(historyPoints, point.index, "priceNormalized", 3, 0.5);
  const smoothVolume = smoothPointValue(historyPoints, point.index, "volumeNormalized", 2, 0.35);
  const smoothVolatility = smoothPointValue(historyPoints, point.index, "localVolatility", 2, 0.12);

  const priceDisplacement = (smoothPrice - 0.5) * 0.72;
  const volumeLift = smoothVolume * 0.22;
  const localJitter = smoothVolatility * (0.2 + visualState.volatility * 0.22);
  const directionPressure =
    point.direction < 0 ? -0.06 * visualState.risk : 0.045 * visualState.liquidity;

  const radius =
    2.08 +
    priceDisplacement +
    volumeLift +
    Math.sin(t * Math.PI * 12) * localJitter * 0.12 +
    directionPressure;

  const y =
    (smoothPrice - 0.5) * 0.64 +
    Math.sin(t * Math.PI * 3.5) * visualState.liquidity * 0.07 +
    Math.cos(t * Math.PI * 8) * smoothVolatility * 0.13;

  return new THREE.Vector3(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius
  );
}
function createFallbackFieldLines(visualState) {
  const lines = [];
  const layerCount = 26;
  const segmentCount = 150;

  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const phase = layerIndex / Math.max(1, layerCount - 1);
    const yOffset = (phase - 0.5) * 1.72;
    const zOffset = -0.92 + phase * 0.46;
    const points = [];

    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
      const t = segmentIndex / Math.max(1, segmentCount - 1);
      const x = (t - 0.5) * 6.7;
      const centerWeight = Math.sin(t * Math.PI);
      const wave =
        Math.sin(t * Math.PI * 4.2 + phase * Math.PI * 3.4) *
          (0.1 + visualState.volatility * 0.22) +
        Math.cos(t * Math.PI * 9.1 - phase * Math.PI * 2.2) *
          (0.035 + visualState.risk * 0.06);

      points.push(
        new THREE.Vector3(
          x,
          yOffset + wave * (0.42 + centerWeight * 0.55),
          zOffset + centerWeight * 0.62
        )
      );
    }

    lines.push({
      id: `fallback-field-line-${layerIndex}`,
      points,
      phase,
      isStress: layerIndex % 7 === 0,
      isMemory: layerIndex % 5 === 0,
    });
  }

  return lines;
}

function createHistoricalFieldLines(visualState, history) {
  const historyPoints = readHistoryPoints(history);

  if (historyPoints.length < 8) {
    return createFallbackFieldLines(visualState);
  }

  const lineCount = 34;
  const result = [];

  for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
    const phase = lineIndex / Math.max(1, lineCount - 1);
    const layerLift = (phase - 0.5) * (1.72 + visualState.volatility * 0.78);
    const layerDepth = -1.08 + phase * 0.64;
    const lateralShift = (phase - 0.5) * 0.34;

    const points = historyPoints.map((point, index) => {
      const base = getLegacyOrbitPoint(
        { ...point, index: point.index ?? index },
        historyPoints,
        visualState
      );

      const progress = Number(point.progress) || index / Math.max(1, historyPoints.length - 1);
      const price = smoothPointValue(historyPoints, index, "priceNormalized", 4, 0.5);
      const volume = smoothPointValue(historyPoints, index, "volumeNormalized", 3, 0.35);
      const volatility = smoothPointValue(historyPoints, index, "localVolatility", 3, 0.12);
      const compression = point.direction < 0 ? -1 : 1;

      const radial = new THREE.Vector3(base.x, 0, base.z).normalize();
      const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
      const temporalWave =
        Math.sin(progress * Math.PI * 10 + phase * Math.PI * 2.6) *
        volatility *
        (0.2 + visualState.volatility * 0.45);

      return base
        .clone()
        .add(radial.multiplyScalar(layerDepth + volume * 0.12 + compression * visualState.risk * 0.035))
        .add(tangent.multiplyScalar(layerLift + lateralShift + temporalWave))
        .add(new THREE.Vector3(0, (price - 0.5) * 0.36 + layerLift * 0.12, 0));
    });

    result.push({
      id: `historical-field-line-${lineIndex}`,
      points,
      phase,
      isStress: lineIndex % 7 === 0,
      isMemory: lineIndex % 5 === 0,
    });
  }

  return result;
}

function createTradeGrain(visualState, history) {
  const historyPoints = readHistoryPoints(history);
  const count = historyPoints.length >= 8 ? Math.min(5200, historyPoints.length * 28) : 2600;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const pointIndex = historyPoints.length
      ? Math.floor((i / Math.max(1, count - 1)) * (historyPoints.length - 1))
      : 0;
    const point = historyPoints[pointIndex];

    if (point) {
      const anchor = getLegacyOrbitPoint(
        { ...point, index: point.index ?? pointIndex },
        historyPoints,
        visualState
      );
      const volume = Number(point.volumeNormalized) || 0.3;
      const volatility = Number(point.localVolatility) || 0.1;
      const radial = new THREE.Vector3(anchor.x, 0, anchor.z).normalize();
      const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
      const spiral = i * 2.399963 + pointIndex * 0.17;
      const spread = 0.2 + volume * 0.68 + volatility * 0.46;
      const distance = spread * Math.sqrt((i % 37) / 37);

      const offset = tangent
        .clone()
        .multiplyScalar(Math.cos(spiral) * distance)
        .add(radial.clone().multiplyScalar(Math.sin(spiral) * distance * 0.6))
        .add(new THREE.Vector3(0, (Math.sin(spiral * 1.3) * 0.5) * spread, 0));

      positions[i * 3] = anchor.x + offset.x;
      positions[i * 3 + 1] = anchor.y + offset.y;
      positions[i * 3 + 2] = anchor.z + offset.z;
    } else {
      const t = i / Math.max(1, count - 1);
      const angle = t * Math.PI * 2;
      const radius = 2.45 + Math.sin(t * Math.PI * 6) * 0.38;

      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.55;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.45;
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.55;
    }
  }

  return positions;
}

export default function BTCMarketFieldLines({ visualState, history }) {
  const groupRef = useRef();
  const grainRef = useRef();
  const coolGrainRef = useRef();

  const fieldLines = useMemo(
    () => createHistoricalFieldLines(visualState, history),
    [visualState, history]
  );

  const tradeGrain = useMemo(
    () => createTradeGrain(visualState, history),
    [visualState, history]
  );

  const coolTradeGrain = useMemo(() => {
    const source = tradeGrain;
    const count = Math.floor(source.length / 3);
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const x = source[i * 3] || 0;
      const y = source[i * 3 + 1] || 0;
      const z = source[i * 3 + 2] || 0;
      const angle = Math.atan2(z, x) + Math.sin(i * 0.73) * 0.11;
      const radius = Math.sqrt(x * x + z * z) + 0.08 + (i % 9) * 0.006;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y + Math.sin(i * 0.37) * 0.08;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return positions;
  }, [tradeGrain]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.05) * 0.018 * visualState.liquidity;
      groupRef.current.rotation.x = -0.1 + Math.cos(time * 0.04) * 0.018 * visualState.volatility;
      groupRef.current.rotation.z = Math.sin(time * 0.035) * 0.012 * visualState.risk;
    }

    if (grainRef.current) {
      grainRef.current.rotation.y = -time * (0.002 + visualState.liquidity * 0.006);
      grainRef.current.rotation.x = Math.sin(time * 0.06) * 0.012 * visualState.volatility;
    }

    if (coolGrainRef.current) {
      coolGrainRef.current.rotation.y = time * (0.0015 + visualState.liquidity * 0.005);
      coolGrainRef.current.rotation.z = Math.cos(time * 0.045) * 0.01 * visualState.volatility;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.06, -0.34]} scale={[1.18, 0.88, 1.08]}>
      {fieldLines.map((line) => {
        const color = line.isStress
          ? visualState.colors.risk
          : line.isMemory
          ? visualState.colors.recovery
          : visualState.colors.liquiditySoft;

        const opacity = line.isStress
          ? 0.16 + visualState.risk * 0.22
          : line.isMemory
          ? 0.13 + visualState.volume * 0.18
          : 0.11 + visualState.liquidity * 0.2;

        return (
          <Line
            key={line.id}
            points={line.points}
            color={color}
            lineWidth={0.34 + line.phase * 0.24 + visualState.volatility * 0.42}
            transparent
            opacity={opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        );
      })}

      <group ref={grainRef}>
        <Points positions={tradeGrain} stride={3}>
          <PointMaterial
            transparent
            color={visualState.colors.recovery}
            size={0.009 + visualState.volume * 0.01}
            sizeAttenuation
            depthWrite={false}
            opacity={0.34 + visualState.volume * 0.36}
            blending={THREE.AdditiveBlending}
          />
        </Points>

        <Points ref={coolGrainRef} positions={coolTradeGrain} stride={3}>
          <PointMaterial
            transparent
            color={visualState.colors.liquiditySoft}
            size={0.006 + visualState.liquidity * 0.007}
            sizeAttenuation
            depthWrite={false}
            opacity={0.18 + visualState.liquidity * 0.28}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>
    </group>
  );
}