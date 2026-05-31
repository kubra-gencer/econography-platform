import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Line, Html, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  getMarketPalette,
  getSemanticColor,
  getMarketSignals,
} from "./systems/colorSystem";

function clamp01(value, fallback = 0.5) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

function getSignals(pulse) {
  return getMarketSignals(pulse);
}


function getMoodColor({ risk, liquidity, volatility, volume = 0.5 }) {
  return getSemanticColor(
    {
      risk,
      liquidity,
      volatility,
      volume,
    },
    "primary"
  );
}


function smoothValue(points, index, key, radius = 3) {
  let sum = 0;
  let weightSum = 0;

  for (let offset = -radius; offset <= radius; offset++) {
    const sample = points[index + offset];
    if (!sample) continue;

    const weight = radius + 1 - Math.abs(offset);
    sum += sample[key] * weight;
    weightSum += weight;
  }

  if (!weightSum) return points[index]?.[key] || 0;
  return sum / weightSum;
}

function formatTooltipDate(timestamp) {
  if (!timestamp) return "Unknown date";

  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTooltipPrice(price) {
  const number = Number(price);
  if (!Number.isFinite(number)) return "$—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatTooltipPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return `${Math.round(number * 100)}%`;
}

function getPointPosition(point, pulse, historyPoints = []) {
  const signals = getSignals(pulse);
  const { risk, liquidity, volatility } = signals;

  const t = point.progress;
  const angle = t * Math.PI * 2;

  const smoothPrice = smoothValue(historyPoints, point.index, "priceNormalized", 3);
  const smoothVolume = smoothValue(historyPoints, point.index, "volumeNormalized", 2);
  const smoothVolatility = smoothValue(historyPoints, point.index, "localVolatility", 2);

  const priceDisplacement = (smoothPrice - 0.5) * 0.68;
  const volumeLift = smoothVolume * 0.18;
  const localJitter = smoothVolatility * (0.18 + volatility * 0.18);
  const directionPressure = point.direction < 0 ? -0.035 * risk : 0.025 * liquidity;

  const radius =
    2.12 +
    priceDisplacement +
    volumeLift +
    Math.sin(t * Math.PI * 12) * localJitter * 0.11 +
    directionPressure;

  const y =
    (smoothPrice - 0.5) * 0.62 +
    Math.sin(t * Math.PI * 3.5) * liquidity * 0.055 +
    Math.cos(t * Math.PI * 8) * smoothVolatility * 0.11;

  return new THREE.Vector3(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius
  );
}

function createFallbackOrbitPoints(pulse) {
  const signals = getSignals(pulse);
  const { volatility, liquidity, risk, volume } = signals;

  const points = [];
  const count = 320;

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 2;

    const trendWave =
      Math.sin(t * Math.PI * 3.5) * 0.08 +
      Math.sin(t * Math.PI * 7.8) * 0.13 * volatility;

    const microVolatility =
      Math.sin(t * Math.PI * 19) * 0.06 * volatility +
      Math.sin(t * Math.PI * 41) * 0.025 * risk;

    const riskFracture =
      risk > 0.55 ? Math.sin(t * Math.PI * 67) * 0.025 * risk : 0;

    const radius =
      2.12 + volume * 0.22 + trendWave + microVolatility + riskFracture;

    const y =
      Math.sin(t * Math.PI * 2.2) * 0.16 * liquidity +
      Math.sin(t * Math.PI * 6.2) * 0.24 * volatility +
      Math.cos(t * Math.PI * 13) * 0.06 * risk;

    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      )
    );
  }

  points.push(points[0].clone());

  return {
    points,
    color: getMoodColor(signals),
    hasHistory: false,
  };
}

function createHistoricalOrbitPoints(pulse, history) {
  const historyPoints = Array.isArray(history?.points) ? history.points : [];

  if (historyPoints.length < 4) {
    return createFallbackOrbitPoints(pulse);
  }

  const points = historyPoints.map((point) =>
    getPointPosition(point, pulse, historyPoints)
  );

  points.push(points[0].clone());

  const signals = getSignals(pulse);

  return {
    points,
    color: getMoodColor(signals),
    hasHistory: true,
  };
}

function createOrbitSnapshot(pulse, history, signature) {
  const orbit = createHistoricalOrbitPoints(pulse, history);

  return {
    signature,
    color: orbit.color,
    hasHistory: orbit.hasHistory,
    points: orbit.points.map((point) => point.clone()),
    createdAt: Date.now(),
  };
}

function createAnomalyPoints(history) {
  const historyPoints = Array.isArray(history?.points) ? history.points : [];
  const anomalies = Array.isArray(history?.anomalies) ? history.anomalies : [];

  if (!historyPoints.length || !anomalies.length) return [];

  return anomalies
    .map((anomaly) => historyPoints[anomaly.index])
    .filter(Boolean)
    .map((point) => ({
      position: getPointPosition(
        point,
        { risk: 0.5, liquidity: 0.55, volatility: 0.45 },
        historyPoints
      ),
      direction: point.direction,
      intensity: point.localVolatility,
    }));
}

function createHistoricalParticlePositions(history, pulse) {
  const historyPoints = Array.isArray(history?.points) ? history.points : [];
  const signals = getSignals(pulse);

  if (historyPoints.length < 4) {
    const count = Math.round(1500 + signals.volume * 1400);
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 2 + Math.random() * 0.55;
      const radius =
        1.95 +
        Math.random() * (1.05 + signals.volume * 1.15) +
        Math.sin(t * Math.PI * 9) * signals.volatility * 0.16;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] =
        (Math.random() - 0.5) * (1.3 + signals.volatility * 1.35);
      array[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return array;
  }

  const count = Math.min(4200, historyPoints.length * 16);
  const array = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const point = historyPoints[i % historyPoints.length];
    const anchor = getPointPosition(point, pulse, historyPoints);
    const angle = point.progress * Math.PI * 2 + (Math.random() - 0.5) * 0.16;
    const volumeSpread = 0.06 + point.volumeNormalized * 0.36;

    array[i * 3] =
      anchor.x + Math.cos(angle) * (Math.random() - 0.5) * volumeSpread;
    array[i * 3 + 1] =
      anchor.y + (Math.random() - 0.5) * (0.16 + point.localVolatility * 0.36);
    array[i * 3 + 2] =
      anchor.z + Math.sin(angle) * (Math.random() - 0.5) * volumeSpread;
  }

  return array;
}

function getPulseChange(pulse) {
  // Returns the price change (e.g., 24h change) from the pulse object, or NaN if unavailable
  if (!pulse) return NaN;
  // Try several possible fields for price change
  if (typeof pulse.priceChange === "number") return pulse.priceChange;
  if (typeof pulse.price_change === "number") return pulse.price_change;
  if (typeof pulse.change === "number") return pulse.change;
  if (typeof pulse.priceChange24h === "number") return pulse.priceChange24h;
  if (typeof pulse.price_change_24h === "number") return pulse.price_change_24h;
  // If pulse has both price and prevPrice fields, compute difference
  if (typeof pulse.price === "number" && typeof pulse.prevPrice === "number") {
    return pulse.price - pulse.prevPrice;
  }
  return NaN;
}

function MarketCore({ pulse }) {
  const coreRef = useRef();
  const shellRef = useRef();
  const innerShellRef = useRef();
  const pulseRef = useRef();
  const nucleusGlowRef = useRef();
  const liveHaloRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, risk, liquidity, volume } = getSignals(pulse);
    const priceChange = getPulseChange(pulse);
    const isDown = Number.isFinite(priceChange) ? priceChange < 0 : risk > liquidity;
    const isUp = Number.isFinite(priceChange) ? priceChange > 0 : liquidity > risk;

    if (coreRef.current) {
      coreRef.current.rotation.y = time * (0.045 + volatility * 0.07);
      coreRef.current.rotation.x = Math.sin(time * 0.22) * 0.08 * risk;
      coreRef.current.scale.setScalar(
        1 + Math.sin(time * 0.55) * 0.025 * liquidity + risk * 0.035
      );
    }

    if (innerShellRef.current) {
      innerShellRef.current.rotation.y = -time * (0.018 + liquidity * 0.012);
      innerShellRef.current.rotation.z = Math.sin(time * 0.18) * 0.04;
      innerShellRef.current.scale.setScalar(1 + Math.sin(time * 0.42) * 0.018);
    }

    if (shellRef.current) {
      shellRef.current.rotation.y = time * (0.012 + volume * 0.015);
      shellRef.current.rotation.x = Math.sin(time * 0.12) * 0.025 * volatility;
      shellRef.current.scale.setScalar(
        1 + Math.sin(time * 0.34) * 0.012 * liquidity
      );
    }

    if (pulseRef.current) {
      pulseRef.current.rotation.z = -time * (0.014 + risk * 0.03);
      pulseRef.current.scale.setScalar(
        1.02 + Math.sin(time * 0.72) * 0.018 + volume * 0.025
      );
    }

    if (nucleusGlowRef.current) {
      nucleusGlowRef.current.scale.setScalar(
        1.04 + Math.sin(time * (isDown ? 2.55 : 1.9)) * 0.12 + volume * 0.04
      );
      nucleusGlowRef.current.material.opacity = isDown
  ? 0.22 + risk * 0.1 + volatility * 0.055
  : isUp
  ? 0.21 + liquidity * 0.085 + volume * 0.045
  : 0.18 + volume * 0.065;
    
    }

    if (liveHaloRef.current) {
      liveHaloRef.current.rotation.z = time * (isDown ? -0.36 : 0.3);
      liveHaloRef.current.rotation.y = Math.sin(time * 0.34) * 0.14;
      liveHaloRef.current.scale.setScalar(
        1.04 + Math.sin(time * 1.2) * 0.04 + volatility * 0.035
      );
      liveHaloRef.current.material.opacity = isDown
        ? 0.34 + risk * 0.1
        : 0.32 + liquidity * 0.1;
    }
  });

  const { risk, liquidity, volume } = getSignals(pulse);
  const palette = getMarketPalette(pulse);
  const priceChange = getPulseChange(pulse);
  const hasPriceDirection = Number.isFinite(priceChange) && Math.abs(priceChange) > 0.0001;
  const isDown = hasPriceDirection ? priceChange < 0 : risk > liquidity;
  const isUp = hasPriceDirection ? priceChange > 0 : liquidity > risk;

  const coreColor = palette.ghost;
  const stressColor = palette.atmosphere;
  const archiveColor = palette.archivalAccent;
  const liveCoreColor = isDown ? "#D52F3F" : isUp ? "#2EC3F7" : "#F0C76A";
  const liveGlowColor = isDown ? "#D52F3F" : isUp ? "#2EC3F7" : "#F0C76A";

  return (
    <group>
      {/* Inner archival boundary shell — subtle market boundary */}
      <mesh ref={innerShellRef}>
        <sphereGeometry args={[1.34, 42, 42]} />
        <meshBasicMaterial
          transparent
          wireframe
          opacity={0.014 + volume * 0.018}
          color={archiveColor}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Soft risk/liquidity pulse skin */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[1.22, 64, 64]} />
        <meshStandardMaterial
          transparent
          opacity={0.075 + risk * 0.045 + liquidity * 0.032}
          color={stressColor}
          emissive={stressColor}
          emissiveIntensity={0.18 + risk * 0.14 + liquidity * 0.08}
          roughness={0.72}
          metalness={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Core market memory geometry */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.05, 4]} />
        <meshBasicMaterial
          wireframe
          transparent
          opacity={0.065 + risk * 0.032 + volume * 0.025}
          color={coreColor}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      

      {/* Inner live BTC signal — color follows real BTC 24h direction */}
      <mesh>
        <sphereGeometry args={[0.15 + volume * 0.018, 48, 48]} />
        <meshBasicMaterial
          transparent
          color={liveCoreColor}
          opacity={isDown ? 0.96 : isUp ? 0.92 : 0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Tiny white-hot specular spark at the heart of the signal */}
      <mesh position={[0.035, 0.035, 0.09]}>
        <sphereGeometry args={[0.038, 24, 24]} />
        <meshBasicMaterial
          transparent
          color="#FFF6D6"
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Small animated live glow around the inner BTC signal */}
      <mesh ref={nucleusGlowRef}>
        <sphereGeometry args={[0.26 + volume * 0.038, 48, 48]} />
        <meshBasicMaterial
          transparent
          color={liveGlowColor}
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Directional live halo: thin inner signal ring */}
      <mesh ref={liveHaloRef} rotation={[Math.PI / 2, 0.08, -0.04]}>
        <torusGeometry args={[0.28 + volume * 0.026, 0.0045, 14, 160]} />
        <meshBasicMaterial
          transparent
          color={liveGlowColor}
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Violet core aura */}
      <mesh>
        <sphereGeometry args={[0.82 + risk * 0.065, 72, 72]} />
        <meshStandardMaterial
          transparent
          color={palette.ghost}
          emissive={palette.ghost}
          emissiveIntensity={0.42 + liquidity * 0.22 + risk * 0.16}
          opacity={0.05 + liquidity * 0.03 + risk * 0.018}
          roughness={0.62}
          metalness={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}


function OrbitTrace({ pulse, history }) {
  const groupRef = useRef();
  const orbit = useMemo(
    () => createHistoricalOrbitPoints(pulse, history),
    [pulse, history]
  );

  const { risk, liquidity, volatility, volume } = getSignals(pulse);
  const palette = getMarketPalette(pulse);

  const traceColor = palette.orbit;
  const ghostColor = palette.ghost;
  const highlightColor = palette.secondary;

  const primaryOpacity = orbit.hasHistory ? 0.68 : 0.74;
  const memoryOpacity = 0.1 + liquidity * 0.1;
  const stressOpacity = risk > 0.42 ? 0.12 + risk * 0.16 : 0.06;

  return (
    <group ref={groupRef}>
      {/* Main financial memory trace */}
      <Line
  points={orbit.points}
  color={traceColor}
  lineWidth={orbit.hasHistory ? 1.18 : 1.34}
  transparent
  opacity={primaryOpacity}
/>

      {/* Fine bright core, gives the trace a precise analytical edge */}
      <Line
        points={orbit.points}
        color={palette.primary}
        lineWidth={0.42}
        transparent
        opacity={orbit.hasHistory ? 0.72 : 0.8}
      />
      

      {/* Warm gold memory glow around the orbit, controlled by volume */}
      <Line
        points={orbit.points}
        color={palette.accent}
        lineWidth={1.9 + volume * 1.45}
        transparent
        opacity={0.18 + volume * 0.075}
        depthWrite={false}
      />

      {/* Memory echo layer: slightly offset, reads as temporal depth */}
      <group rotation={[0.028, 0.018, -0.014]} scale={1.007}>
        <Line
          points={orbit.points}
          color={traceColor}
          lineWidth={0.42}
          transparent
          opacity={memoryOpacity}
        />
      </group>

      {/* Secondary ghost layer: creates archival residue without clutter */}
      <group rotation={[-0.022, -0.014, 0.021]} scale={0.993}>
        <Line
          points={orbit.points}
          color={ghostColor}
          lineWidth={0.32}
          transparent
          opacity={0.08 + liquidity * 0.095}
        />
      </group>

      {/* Stress contour: becomes visible when risk/volatility increases */}
      <group
        rotation={[
          0.012 + volatility * 0.018,
          -0.018,
          0.018 + risk * 0.026,
        ]}
        scale={1.012 + risk * 0.012}
      >
        <Line
          points={orbit.points}
          color={ghostColor}
          lineWidth={0.28 + risk * 0.42}
          transparent
          opacity={stressOpacity}
        />
      </group>
    </group>
  );
}

function TemporalMemoryRibbons({ pulse, history }) {
  const groupRef = useRef();
  const orbit = useMemo(
    () => createHistoricalOrbitPoints(pulse, history),
    [pulse, history]
  );

  const ribbonSets = useMemo(() => {
    const source = orbit.points || [];
    if (source.length < 8) return [];

    return [
      {
        scale: 1.035,
        rotation: [0.045, 0.018, -0.032],
        opacity: 0.075,
        width: 0.28,
        colorShift: "memory",
      },
      {
        scale: 0.965,
        rotation: [-0.038, -0.022, 0.036],
        opacity: 0.06,
        width: 0.22,
        colorShift: "liquidity",
      },
      {
        scale: 1.075,
        rotation: [0.018, -0.04, 0.052],
        opacity: 0.045,
        width: 0.18,
        colorShift: "stress",
      },
    ];
  }, [orbit.points]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk } = getSignals(pulse);

    if (!groupRef.current) return;

    groupRef.current.rotation.y = Math.sin(time * 0.09) * 0.018 * liquidity;
    groupRef.current.rotation.x = Math.cos(time * 0.07) * 0.014 * volatility;
    groupRef.current.rotation.z = Math.sin(time * 0.055) * 0.012 * risk;
  });

  const { risk, liquidity, volatility } = getSignals(pulse);

  if (!ribbonSets.length) return null;

  return (
    <group ref={groupRef}>
      {ribbonSets.map((ribbon, index) => {
        const palette = getMarketPalette(pulse);
        const color =
          ribbon.colorShift === "stress"
            ? palette.fracture
            : ribbon.colorShift === "liquidity"
            ? palette.secondary
            : palette.ghost;

        const opacity =
          ribbon.opacity + liquidity * 0.04 + volatility * 0.018 + risk * 0.014;

        return (
          <group
            key={`${ribbon.colorShift}-${index}`}
            rotation={ribbon.rotation}
            scale={ribbon.scale}
          >
            <Line
              points={orbit.points}
              color={color}
              lineWidth={ribbon.width}
              transparent
              opacity={opacity}
            />
          </group>
        );
      })}
    </group>
  );
}

function GhostMemoryTrails({ archive, pulse }) {
  const groupRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk } = getSignals(pulse);

    if (!groupRef.current) return;

    groupRef.current.rotation.y = -time * (0.004 + liquidity * 0.006);
    groupRef.current.rotation.x = Math.sin(time * 0.05) * 0.018 * volatility;
    groupRef.current.rotation.z = Math.cos(time * 0.04) * 0.014 * risk;
  });

  if (!Array.isArray(archive) || archive.length === 0) return null;

  return (
    <group ref={groupRef}>
      {archive.map((snapshot, index) => {
        const age = index + 1;
        const opacity = Math.max(0.024, 0.135 - age * 0.024);
        const scale = 1 + age * 0.025;
        const rotationOffset = age * 0.032;
        const palette = getMarketPalette(pulse);
        const color = age % 2 === 0 ? palette.ghost : snapshot.color;
        const highlightColor = palette.secondary;

        return (
          <group
            key={`${snapshot.signature}-${index}`}
            scale={scale}
            rotation={[
              rotationOffset * 0.8,
              -rotationOffset * 1.2,
              rotationOffset,
            ]}
          >
            <Line
              points={snapshot.points}
              color={color}
              lineWidth={0.28}
              transparent
              opacity={opacity}
            />

            <Line
              points={snapshot.points}
              color={highlightColor}
              lineWidth={0.08}
              transparent
              opacity={opacity * 0.58}
            />

            <Line
              points={snapshot.points}
              color={color}
              lineWidth={1.4 + age * 0.22}
              transparent
              opacity={opacity * 0.18}
            />
          </group>
        );
      })}
    </group>
  );
}

function MemoryReconstructionPulse({ pulseKey, pulse }) {
  const groupRef = useRef();
  const outerRingRef = useRef();
  const innerRingRef = useRef();
  const shellRef = useRef();
  const startTimeRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = 0;

    if (groupRef.current) {
      groupRef.current.visible = true;
    }
  }, [pulseKey]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk, volume } = getSignals(pulse);

    if (!startTimeRef.current) {
      startTimeRef.current = time;
    }

    const elapsed = time - startTimeRef.current;
    const duration = 2.2;
    const progress = Math.min(1, elapsed / duration);
    const fade = Math.max(0, 1 - progress);
    const expansion = 1 + progress * (0.42 + volume * 0.18);

    if (groupRef.current) {
      groupRef.current.visible = fade > 0.015;
      groupRef.current.rotation.y = time * (0.08 + liquidity * 0.05);
      groupRef.current.rotation.x = Math.sin(time * 0.22) * 0.035 * volatility;
      groupRef.current.rotation.z = -time * (0.035 + risk * 0.025);
    }

    if (outerRingRef.current) {
      outerRingRef.current.scale.setScalar(expansion);
      outerRingRef.current.material.opacity = fade * (0.28 + risk * 0.16);
    }

    if (innerRingRef.current) {
      innerRingRef.current.scale.setScalar(0.82 + progress * 0.36);
      innerRingRef.current.material.opacity = fade * (0.3 + liquidity * 0.14);
    }

    if (shellRef.current) {
      shellRef.current.scale.setScalar(0.9 + progress * 0.58);
      shellRef.current.material.opacity = fade * (0.055 + volatility * 0.045);
    }
  });

  const { risk, liquidity, volatility } = getSignals(pulse);
  const palette = getMarketPalette(pulse);
  const color = palette.primary;
  const warmColor = risk > 0.55 ? palette.fracture : palette.accent;

  return (
    <group ref={groupRef}>
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.18, 0.012, 16, 180]} />
        <meshBasicMaterial
          transparent
          color={warmColor}
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0.18, 0.08]}>
        <torusGeometry args={[1.82, 0.008, 14, 160]} />
        <meshBasicMaterial
          transparent
          color={color}
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      
    </group>
  );
}

function HistoricalPointHotspots({ pulse, history, hoveredPoint, setHoveredPoint }) {
  const historyPoints = Array.isArray(history?.points) ? history.points : [];

  const hotspots = useMemo(() => {
    if (historyPoints.length < 4) return [];

    const step = Math.max(1, Math.floor(historyPoints.length / 54));

    return historyPoints
      .filter((_, index) => index % step === 0 || index === historyPoints.length - 1)
      .map((point) => ({
        point,
        position: getPointPosition(point, pulse, historyPoints),
      }));
  }, [historyPoints, pulse]);

  if (!hotspots.length) return null;

  const palette = getMarketPalette(pulse);

  return (
    <group>
      {hotspots.map(({ point, position }) => {
        const isHovered = hoveredPoint?.index === point.index;
        const isContraction = point.direction < 0;
        const nodeColor = isContraction ? "#7C0E1A" : "#2D8FA0";
        const goldSeedColor = "#E2B75A";
        const coolSpecularColor = palette.primary;
        const ringColor = isContraction ? palette.fracture : palette.ghost;
        const directionStyle = { color: nodeColor };

        const volumeSize = 0.03 + point.volumeNormalized * 0.016;
        const volatilitySize = point.localVolatility * 0.01;
        const radius = isHovered ? 0.07 : Math.min(0.05, volumeSize + volatilitySize);
        const showMicroRing = isHovered || point.localVolatility > 0.42 || point.volumeNormalized > 0.62;
        const showSecondSeed = isHovered || point.volumeNormalized > 0.52 || point.localVolatility > 0.5;

        return (
          <group key={point.index} position={position}>
            {/* Physical market-memory bead: compact glass/metal material, not a flat UI dot */}
            <mesh
              onPointerOver={(event) => {
                event.stopPropagation();
                setHoveredPoint(point);
                document.body.style.cursor = "crosshair";
              }}
              onPointerOut={(event) => {
                event.stopPropagation();
                setHoveredPoint(null);
                document.body.style.cursor = "";
              }}
            >
              <sphereGeometry args={[radius, 48, 48]} />
              <meshPhysicalMaterial
                color={nodeColor}
                emissive={nodeColor}
                emissiveIntensity={isContraction ? (isHovered ? 0.32 : 0.14) : (isHovered ? 0.34 : 0.16)}
                roughness={0.12}
                metalness={0.22}
                clearcoat={1}
                clearcoatRoughness={0.06}
                reflectivity={0.88}
              />
            </mesh>

            {/* Gold data seed embedded inside the bead */}
            <mesh position={[radius * 0.28, radius * 0.18, radius * 0.5]}>
              <sphereGeometry args={[Math.max(0.012, radius * 0.24), 18, 18]} />
              <meshBasicMaterial
                transparent
                color={goldSeedColor}
                opacity={isHovered ? 1 : 0.96}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Tight gold glow, gives the point an inner financial-memory spark */}
            <mesh position={[radius * 0.28, radius * 0.18, radius * 0.5]}>
              <sphereGeometry args={[Math.max(0.018, radius * 0.38), 18, 18]} />
              <meshBasicMaterial
                transparent
                color={goldSeedColor}
                opacity={isHovered ? 0.26 : 0.16}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {/* Tiny cool specular glint, gives the bead a 3D surface cue */}
            <mesh position={[-radius * 0.18, radius * 0.34, radius * 0.38]}>
              <sphereGeometry args={[Math.max(0.0045, radius * 0.095), 12, 12]} />
              <meshBasicMaterial
                transparent
                color={coolSpecularColor}
                opacity={isHovered ? 0.86 : 0.58}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>

            {showSecondSeed && (
              <mesh position={[-radius * 0.34, -radius * 0.12, radius * 0.34]}>
                <sphereGeometry args={[Math.max(0.004, radius * 0.085), 12, 12]} />
                <meshBasicMaterial
                  transparent
                  color={goldSeedColor}
                  opacity={isHovered ? 0.78 : 0.52}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            )}

            {showMicroRing && (
              <mesh rotation={[Math.PI / 2, 0.16, 0.08]}>
                <torusGeometry args={[radius * 1.28, 0.0014, 8, 56]} />
                <meshBasicMaterial
                  transparent
                  color={ringColor}
                  opacity={isHovered ? 0.16 : 0.045 + point.localVolatility * 0.032}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            )}

            {isHovered && (
              <Html
                center
                transform={false}
                zIndexRange={[100, 0]}
                style={{
                  pointerEvents: "none",
                  transform: "translate3d(-50%, -115%, 0)",
                }}
              >
                <div className="pointer-events-none w-[220px] rounded-2xl border border-white/12 bg-[#030406]/94 px-4 py-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
                  <p className="mono-font text-[0.48rem] uppercase tracking-[0.16em] text-dim">
                    BTC Memory Point
                  </p>

                  <p className="mt-2 text-[0.82rem] font-medium text-white">
                    {formatTooltipDate(point.timestamp)}
                  </p>

                  <div className="mt-2 space-y-1 text-[0.68rem] leading-5 text-white/68">
                    <p>
                      Price:{" "}
                      <span className="text-white/86">
                        {formatTooltipPrice(point.price)}
                      </span>
                    </p>

                    <p>
                      Direction:{" "}
                      <span style={directionStyle}>
                        {isContraction ? "contraction" : "expansion"}
                      </span>
                    </p>

                    <p>
                      Volume texture:{" "}
                      <span className="text-white/86">
                        {formatTooltipPercent(point.volumeNormalized)}
                      </span>
                    </p>

                    <p>
                      Local volatility:{" "}
                      <span className="text-white/86">
                        {formatTooltipPercent(point.localVolatility)}
                      </span>
                    </p>

                    <p className="border-t border-white/10 pt-1.5 text-white/54">
                      Meaning: {isContraction
                        ? "risk compresses this memory point inward"
                        : "liquidity expands this memory point outward"}
                    </p>
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function CurrentMarketPoint({ pulse, history }) {
  const ref = useRef();
  const haloRef = useRef();
  const outerHaloRef = useRef();
  const beaconRef = useRef();
  const beaconGlowRef = useRef();

  const latestHistoryPoint = useMemo(() => {
    const points = Array.isArray(history?.points) ? history.points : [];
    return points[points.length - 1] || null;
  }, [history]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, volume, risk, liquidity } = getSignals(pulse);
    const targetPosition = new THREE.Vector3();

    if (latestHistoryPoint) {
      targetPosition.copy(
        getPointPosition(latestHistoryPoint, pulse, history?.points || [])
      );
    } else {
      const angle = time * (0.55 + volatility * 0.35);
      const radius = 2.18 + volume * 0.22;

      targetPosition.set(
        Math.cos(angle) * radius,
        Math.sin(time * 1.4) * 0.22 * volatility,
        Math.sin(angle) * radius
      );
    }

    if (ref.current) {
      ref.current.position.copy(targetPosition);
      ref.current.scale.setScalar(1 + Math.sin(time * 3.2) * 0.16);
    }

    if (haloRef.current) {
      haloRef.current.position.copy(targetPosition);
      haloRef.current.rotation.z = time * (0.4 + liquidity * 0.28);
      haloRef.current.scale.setScalar(
        1 + Math.sin(time * 1.6) * 0.12 + volume * 0.35
      );
    }

    if (outerHaloRef.current) {
      outerHaloRef.current.position.copy(targetPosition);
      outerHaloRef.current.rotation.z = -time * (0.18 + risk * 0.32);
      outerHaloRef.current.scale.setScalar(
        1.15 + Math.sin(time * 1.1) * 0.1 + volatility * 0.42
      );
    }

    if (beaconRef.current) {
      beaconRef.current.position.copy(targetPosition);
      beaconRef.current.rotation.y = time * (0.7 + liquidity * 0.45);
      beaconRef.current.rotation.x = Math.sin(time * 1.1) * 0.16 * volatility;
      beaconRef.current.scale.setScalar(
        1 + Math.sin(time * 2.4) * 0.18 + volume * 0.18
      );
    }

    if (beaconGlowRef.current) {
      beaconGlowRef.current.position.copy(targetPosition);
      beaconGlowRef.current.rotation.z = -time * (0.32 + risk * 0.28);
      beaconGlowRef.current.scale.setScalar(
        1.15 + Math.sin(time * 1.8) * 0.22 + volatility * 0.26
      );
      beaconGlowRef.current.material.opacity = 0.34 + volume * 0.22 + risk * 0.12;
    }
  });

  const { risk, liquidity, volume } = getSignals(pulse);
  const palette = getMarketPalette(pulse);
  const color = palette.primary;
  const warmAccent = palette.accent;

  return (
    <group>
      {/* Outer live market pulse halo */}
      <mesh ref={outerHaloRef}>
        <torusGeometry args={[0.105 + volume * 0.05, 0.005, 10, 64]} />
        <meshBasicMaterial
          transparent
          color={warmAccent}
          opacity={0.26 + risk * 0.22}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner analytic pulse ring */}
      <mesh ref={haloRef}>
        <torusGeometry args={[0.07 + liquidity * 0.035, 0.004, 10, 64]} />
        <meshBasicMaterial
          transparent
          color={color}
          opacity={0.36 + volume * 0.26}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Current market point core */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.052 + volume * 0.022, 20, 20]} />
        <meshBasicMaterial
          transparent
          color={color}
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Live beacon crosshair */}
      <mesh ref={beaconRef}>
        <torusGeometry args={[0.155 + liquidity * 0.035, 0.0035, 8, 96]} />
        <meshBasicMaterial
          transparent
          color={color}
          opacity={0.42 + liquidity * 0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Soft live beacon glow */}
      <mesh ref={beaconGlowRef}>
        <sphereGeometry args={[0.18 + volume * 0.055, 24, 24]} />
        <meshBasicMaterial
          transparent
          color={warmAccent}
          opacity={0.52}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function AnomalyMarkers({ pulse, history }) {
  const groupRef = useRef();

  const anomalies = useMemo(() => createAnomalyPoints(history), [history]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(time * 0.08) * 0.02;
  });

  if (!anomalies.length) return null;

  const palette = getMarketPalette(pulse);

  return (
    <group ref={groupRef}>
      {anomalies.map((anomaly, index) => {
        const isNegative = anomaly.direction < 0;
        const coreColor = isNegative ? palette.fracture : palette.accent;
        const outerColor = isNegative ? palette.halo : palette.secondary;
        const intensity = 0.7 + anomaly.intensity * 1.8;

        return (
          <group key={index} position={anomaly.position}>
            <mesh>
              <sphereGeometry args={[0.115 + anomaly.intensity * 0.22, 22, 22]} />
              <meshBasicMaterial transparent color={outerColor} opacity={0.075 + anomaly.intensity * 0.12} blending={THREE.AdditiveBlending} />
            </mesh>

            <mesh>
              <sphereGeometry args={[0.055 + anomaly.intensity * 0.105, 18, 18]} />
              <meshBasicMaterial transparent color={coreColor} opacity={0.2 + anomaly.intensity * 0.24} blending={THREE.AdditiveBlending} />
            </mesh>

            <mesh scale={intensity}>
              <sphereGeometry args={[0.018, 14, 14]} />
              <meshBasicMaterial transparent color={coreColor} opacity={0.92} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function VolatilityFractureLines({ pulse, history }) {
  const groupRef = useRef();
  const anomalies = useMemo(() => createAnomalyPoints(history), [history]);

  const palette = getMarketPalette(pulse);

  const fractureSegments = useMemo(() => {
    if (!anomalies.length) return [];

    return anomalies.slice(0, 18).map((anomaly, index) => {
      const base = anomaly.position;
      const direction = new THREE.Vector3(base.x, 0, base.z).normalize();
      const tangent = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      const lift = new THREE.Vector3(0, 1, 0);
      const intensity = 0.08 + anomaly.intensity * 0.24;

      const start = base
        .clone()
        .add(tangent.clone().multiplyScalar((index % 2 === 0 ? 1 : -1) * intensity))
        .add(lift.clone().multiplyScalar((Math.random() - 0.5) * intensity));

      const end = base
        .clone()
        .add(tangent.clone().multiplyScalar((index % 2 === 0 ? -1 : 1) * intensity * 1.45))
        .add(lift.clone().multiplyScalar((Math.random() - 0.5) * intensity * 1.2));

      return {
        points: [start, end],
        color: anomaly.direction < 0 ? palette.fracture : palette.accent,
        opacity: 0.42 + anomaly.intensity * 0.46,
        width: 0.42 + anomaly.intensity * 0.58,
      };
    });
  }, [anomalies, palette.fracture, palette.accent]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!groupRef.current) return;

    groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.018;
    groupRef.current.rotation.z = Math.cos(time * 0.07) * 0.012;
  });

  if (!fractureSegments.length) return null;

  return (
    <group ref={groupRef}>
      {fractureSegments.map((segment, index) => (
        <group key={`fracture-${index}`}>
          <Line
            points={segment.points}
            color={segment.color}
            lineWidth={segment.width * 2.6}
            transparent
            opacity={segment.opacity * 0.34}
            depthWrite={false}
          />
          <Line
            points={segment.points}
            color={segment.color}
            lineWidth={segment.width * 0.82}
            transparent
            opacity={segment.opacity * 0.86}
            depthWrite={false}
          />
        </group>
      ))}
    </group>
  );
}


function EventDeformationField({ pulse, history }) {
  const groupRef = useRef();
  const historyPoints = Array.isArray(history?.points) ? history.points : [];

  const palette = getMarketPalette(pulse);

  const eventFields = useMemo(() => {
    if (historyPoints.length < 8) return [];

    return historyPoints
      .filter((point, index) => {
        if (index === 0 || index === historyPoints.length - 1) return false;
        return point.localVolatility > 0.46 || Math.abs(point.direction) > 0.75;
      })
      .slice(0, 22)
      .map((point, index) => {
        const anchor = getPointPosition(point, pulse, historyPoints);
        const radial = new THREE.Vector3(anchor.x, 0, anchor.z).normalize();
        const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
        const polarity = point.direction < 0 ? -1 : 1;
        const intensity = 0.16 + point.localVolatility * 0.42;
        const isContraction = point.direction < 0;
        const isHighVolatility = point.localVolatility > 0.56;
        const isHighVolume = point.volumeNormalized > 0.62;
        const lineColor = isContraction
          ? palette.fracture
          : isHighVolatility
          ? palette.ghost
          : isHighVolume
          ? palette.accent
          : palette.secondary;
        const glowColor = isContraction
          ? palette.fracture
          : isHighVolatility
          ? palette.primary
          : isHighVolume
          ? palette.archivalAccent
          : palette.primary;

        const curvePoints = [];
        const segmentCount = 10;

        for (let i = 0; i < segmentCount; i++) {
          const t = i / Math.max(1, segmentCount - 1);
          const bend = Math.sin(t * Math.PI) * intensity;
          const spread = (t - 0.5) * intensity * 1.8;
          const lift = Math.sin(t * Math.PI) * 0.16 * point.localVolatility;

          curvePoints.push(
            anchor
              .clone()
              .add(radial.clone().multiplyScalar(bend * polarity))
              .add(tangent.clone().multiplyScalar(spread))
              .add(new THREE.Vector3(0, lift, 0))
          );
        }

        return {
          key: `${point.index}-${index}`,
          points: curvePoints,
          color: lineColor,
          glowColor,
          opacity: 0.2 + point.localVolatility * 0.28,
          width: 0.42 + point.localVolatility * 0.78,
          scale: 1 + point.localVolatility * 0.18,
          rotation: [
            point.localVolatility * 0.045,
            index * 0.035,
            polarity * point.localVolatility * 0.08,
          ],
        };
      });
  }, [historyPoints, pulse, palette.fracture, palette.accent]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, risk, liquidity } = getSignals(pulse);

    if (!groupRef.current) return;

    groupRef.current.rotation.y = time * (0.006 + risk * 0.018);
    groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.018 * volatility;
    groupRef.current.rotation.z = Math.cos(time * 0.06) * 0.014 * liquidity;
  });

  if (!eventFields.length) return null;

  return (
    <group ref={groupRef}>
      {eventFields.map((field) => (
        <group key={field.key} scale={field.scale} rotation={field.rotation}>
          {/* Event deformation glow — semantic market pressure aura */}
          <Line
            points={field.points}
            color={field.glowColor}
            lineWidth={field.width * 4.1}
            transparent
            opacity={field.opacity * 0.58}
            depthWrite={false}
          />

          {/* Event deformation body — colored by financial meaning */}
          <Line
            points={field.points}
            color={field.color}
            lineWidth={field.width * 0.52}
            transparent
            opacity={field.opacity * 0.46}
            depthWrite={false}
          />

          {/* Bright readable event core — prevents dark scratch effect */}
          <Line
            points={field.points}
            color={field.glowColor}
            lineWidth={0.46}
            transparent
            opacity={Math.min(1, field.opacity * 1.45)}
            depthWrite={false}
          />
        </group>
      ))}
    </group>
  );
}

function LiquidityFlowStreams({ pulse, history }) {
  const groupRef = useRef();
  const historyPoints = Array.isArray(history?.points) ? history.points : [];

  const streamLines = useMemo(() => {
    const source = historyPoints.length >= 4 ? historyPoints : [];
    const lineCount = source.length >= 4 ? 18 : 14;
    const result = [];

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
      const points = [];
      const phase = lineIndex / lineCount;
      const verticalOffset = (phase - 0.5) * 0.58;
      const radialOffset = 0.12 + phase * 0.34;
      const segmentCount = 42;

      for (let i = 0; i < segmentCount; i++) {
        const t = i / Math.max(1, segmentCount - 1);
        const wrapped = (t + phase * 0.19) % 1;
        const angle = wrapped * Math.PI * 2;

        let radius = 2.28 + radialOffset;
        let y = verticalOffset + Math.sin((wrapped + phase) * Math.PI * 4) * 0.075;

        if (source.length >= 4) {
          const sourceIndex = Math.min(
            source.length - 1,
            Math.floor(wrapped * (source.length - 1))
          );
          const point = source[sourceIndex];
          const localVolatility = point?.localVolatility || 0;
          const volume = point?.volumeNormalized || 0;

          radius += volume * 0.18 + localVolatility * 0.16;
          y += (point?.priceNormalized - 0.5 || 0) * 0.2;
        }

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius
          )
        );
      }

      result.push({
        points,
        phase,
        width: 0.12 + phase * 0.12,
      });
    }

    return result;
  }, [historyPoints]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { liquidity, volatility, risk, volume } = getSignals(pulse);

    if (!groupRef.current) return;

    groupRef.current.rotation.y = -time * (0.01 + liquidity * 0.032);
    groupRef.current.rotation.x = Math.sin(time * 0.09) * 0.022 * volatility;
    groupRef.current.rotation.z = Math.cos(time * 0.07) * 0.018 * risk;
    groupRef.current.scale.setScalar(
      1 + Math.sin(time * 0.28) * 0.012 + volume * 0.018
    );
  });

  const { liquidity, volatility, risk, volume } = getSignals(pulse);
  const palette = getMarketPalette(pulse);
  const liquidityColor = palette.secondary;
  const stressColor = palette.fracture;
  const archiveColor = palette.accent;

  return (
    <group ref={groupRef}>
      {streamLines.map((stream, index) => {
        const isStressStream = index % 3 === 0;
        const isArchiveStream = index % 5 === 0;
        const streamColor = isArchiveStream
          ? archiveColor
          : isStressStream
          ? stressColor
          : liquidityColor;
        const opacity = isArchiveStream
          ? 0.12 + volume * 0.11
          : isStressStream
          ? 0.1 + risk * 0.12
          : 0.16 + liquidity * 0.18 + volume * 0.075;

        return (
          <Line
            key={`liquidity-flow-${index}`}
            points={stream.points}
            color={streamColor}
            lineWidth={stream.width + volatility * 0.34}
            transparent
            opacity={opacity}
          />
        );
      })}
    </group>
  );
}

function OrbitParticles({ pulse, history }) {
  const ref = useRef();
  const flowRef = useRef();

  const positions = useMemo(
    () => createHistoricalParticlePositions(history, pulse),
    [history, pulse]
  );

  const secondaryPositions = useMemo(() => {
    const count = Math.floor(positions.length / 6);
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const stride = i * 6;

      array[i * 3] = positions[stride] + (Math.random() - 0.5) * 0.22;
      array[i * 3 + 1] =
        positions[stride + 1] + (Math.random() - 0.5) * 0.18;
      array[i * 3 + 2] =
        positions[stride + 2] + (Math.random() - 0.5) * 0.22;
    }

    return array;
  }, [positions]);

  const flowPositions = useMemo(() => {
    const count = Math.floor(positions.length / 9);
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const stride = i * 9;
      const x = positions[stride] || 0;
      const y = positions[stride + 1] || 0;
      const z = positions[stride + 2] || 0;
      const swirl = Math.atan2(z, x) + Math.random() * 0.42;
      const radius = Math.sqrt(x * x + z * z) + 0.12 + Math.random() * 0.36;

      array[i * 3] = Math.cos(swirl) * radius;
      array[i * 3 + 1] = y + (Math.random() - 0.5) * 0.42;
      array[i * 3 + 2] = Math.sin(swirl) * radius;
    }

    return array;
  }, [positions]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { liquidity, volatility, risk, volume } = getSignals(pulse);

    if (ref.current) {
      ref.current.rotation.y = time * (0.004 + liquidity * 0.012);
      ref.current.rotation.z = Math.sin(time * 0.08) * 0.018 * volatility;
      ref.current.position.y = Math.sin(time * 0.22) * 0.03 * risk;
      ref.current.scale.setScalar(1 + Math.sin(time * 0.32) * 0.012 * volume);
    }

    if (flowRef.current) {
      flowRef.current.rotation.y = -time * (0.012 + liquidity * 0.035);
      flowRef.current.rotation.x = Math.sin(time * 0.18) * 0.025 * volatility;
      flowRef.current.rotation.z = Math.cos(time * 0.12) * 0.018 * risk;
      flowRef.current.scale.setScalar(
        1.02 + Math.sin(time * 0.42) * 0.018 + volume * 0.035
      );
    }
  });

  const { risk, liquidity, volatility, volume } = getSignals(pulse);
  const palette = getMarketPalette(pulse);

  const primaryColor = palette.particles;
  const flowColor = palette.secondary;

  return (
    <group>
      <group ref={ref}>
        {/* Dense inner atmosphere */}
        <Points positions={positions} stride={3}>
          <PointMaterial
            transparent
            color={primaryColor}
            size={0.0085 + volume * 0.0055}
            sizeAttenuation
            depthWrite={false}
            opacity={0.88 + volume * 0.42}
            blending={THREE.AdditiveBlending}
          />
        </Points>

        {/* Wider soft atmospheric layer */}
        <Points positions={secondaryPositions} stride={3}>
          <PointMaterial
            transparent
            color={palette.ghost}
            size={0.018 + liquidity * 0.009}
            sizeAttenuation
            depthWrite={false}
            opacity={0.38 + liquidity * 0.22}
            blending={THREE.AdditiveBlending}
          />
        </Points>

        {/* Subtle warm archival dust */}
        <Points positions={secondaryPositions} stride={3}>
          <PointMaterial
            transparent
            color={palette.accent}
            size={0.0085}
            sizeAttenuation
            depthWrite={false}
            opacity={0.34 + volatility * 0.14}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>

      {/* Flow-field morphology layer */}
      <group ref={flowRef}>
        <Points positions={flowPositions} stride={3}>
          <PointMaterial
            transparent
            color={flowColor}
            size={0.019 + liquidity * 0.009}
            sizeAttenuation
            depthWrite={false}
            opacity={0.18 + liquidity * 0.18 + volatility * 0.07}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      </group>
    </group>
  );
}

function TemporalMemorySystem({
  pulse,
  history,
  orbitArchive,
  reconstructionKey,
  hoveredPoint,
  setHoveredPoint,
}) {
  const groupRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk } = getSignals(pulse);

    if (!groupRef.current) return;

    groupRef.current.rotation.y = time * (0.032 + liquidity * 0.026);
    groupRef.current.rotation.x = Math.sin(time * 0.14) * 0.045 * volatility;
    groupRef.current.rotation.z = Math.cos(time * 0.11) * 0.026 * risk;
  });

  return (
    <group ref={groupRef}>
      <GhostMemoryTrails archive={orbitArchive} pulse={pulse} />
      <MemoryReconstructionPulse pulseKey={reconstructionKey} pulse={pulse} />
      <OrbitParticles pulse={pulse} history={history} />
      <LiquidityFlowStreams pulse={pulse} history={history} />
      <TemporalMemoryRibbons pulse={pulse} history={history} />
      <OrbitTrace pulse={pulse} history={history} />
      <VolatilityFractureLines pulse={pulse} history={history} />
      <EventDeformationField pulse={pulse} history={history} />
      <AnomalyMarkers pulse={pulse} history={history} />
      <HistoricalPointHotspots
        pulse={pulse}
        history={history}
        hoveredPoint={hoveredPoint}
        setHoveredPoint={setHoveredPoint}
      />
      <CurrentMarketPoint pulse={pulse} history={history} />
    </group>
  );
}

function MarketDust({ pulse }) {
  const ref = useRef();
  const farRef = useRef();

  const positions = useMemo(() => {
    const count = 1800;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 12;
      array[i * 3 + 1] = (Math.random() - 0.5) * 6.4;
      array[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    return array;
  }, []);

  const farPositions = useMemo(() => {
    const count = 900;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 4.5 + Math.random() * 3.8;
      const angle = Math.random() * Math.PI * 2;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = (Math.random() - 0.5) * 5.8;
      array[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return array;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk, volume } = getSignals(pulse);

    if (ref.current) {
      ref.current.rotation.y = time * (0.003 + liquidity * 0.004);
      ref.current.rotation.x = Math.sin(time * 0.06) * 0.012 * volatility;
      ref.current.position.y = Math.sin(time * 0.16) * 0.02 * risk;
      ref.current.scale.setScalar(1 + Math.sin(time * 0.26) * 0.01 * volume);
    }

    if (farRef.current) {
      farRef.current.rotation.y = -time * (0.0018 + volume * 0.003);
      farRef.current.rotation.z = Math.cos(time * 0.05) * 0.008 * liquidity;
    }
  });
  const { risk, liquidity, volatility, volume } = getSignals(pulse);
  const palette = getMarketPalette(pulse);
  const dustColor = palette.particles;
  const farDustColor = palette.ghost;


  return (
    <group>
      <Points ref={ref} positions={positions} stride={3}>
        <PointMaterial
          transparent
          color={dustColor}
          size={0.011 + volume * 0.005}
          sizeAttenuation
          depthWrite={false}
          opacity={0.54 + volume * 0.2 + volatility * 0.12}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points ref={farRef} positions={farPositions} stride={3}>
        <PointMaterial
          transparent
          color={farDustColor}
          size={0.007}
          sizeAttenuation
          depthWrite={false}
          opacity={0.22 + liquidity * 0.1}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function RiskHalo({ pulse }) {
  const primaryRef = useRef();
  const secondaryRef = useRef();
  const stressShellRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { risk, volatility, liquidity } = getSignals(pulse);

    if (primaryRef.current) {
      primaryRef.current.rotation.z = time * (0.012 + risk * 0.026);
      primaryRef.current.rotation.x = Math.sin(time * 0.16) * 0.02 * volatility;
      primaryRef.current.scale.setScalar(
        1 + Math.sin(time * 0.75) * 0.025 * risk
      );
    }

    if (secondaryRef.current) {
      secondaryRef.current.rotation.z = -time * (0.009 + liquidity * 0.018);
      secondaryRef.current.rotation.y = Math.cos(time * 0.13) * 0.018 * volatility;
      secondaryRef.current.scale.setScalar(
        1.025 + Math.sin(time * 0.48) * 0.018 * liquidity
      );
    }

    if (stressShellRef.current) {
      stressShellRef.current.rotation.y = time * (0.006 + risk * 0.02);
      stressShellRef.current.rotation.x = Math.sin(time * 0.11) * 0.025 * risk;
      stressShellRef.current.scale.setScalar(
        1.02 + Math.sin(time * 0.55) * 0.02 * volatility
      );
    }
  });

  const { risk, volatility, liquidity, volume } = getSignals(pulse);
  const palette = getMarketPalette(pulse);
  const riskColor = palette.halo;
  const secondaryColor = palette.archival;
  const stressOpacity = risk > 0.5 ? 0.018 + risk * 0.055 : 0.012;

  return (
    <group>
      {/* Primary risk contour */}
      <mesh ref={primaryRef}>
        <torusGeometry args={[2.36, 0.014 + risk * 0.038, 18, 180]} />
        <meshBasicMaterial
          transparent
          color={riskColor}
          opacity={0.075 + risk * 0.19}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Secondary liquidity contour */}
      <mesh ref={secondaryRef} rotation={[0.08, -0.04, 0.02]}>
        <torusGeometry args={[2.53 + liquidity * 0.08, 0.006 + volume * 0.012, 14, 160]} />
        <meshBasicMaterial
          transparent
          color={secondaryColor}
          opacity={0.04 + liquidity * 0.075}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Very soft stress shell */}
      <mesh ref={stressShellRef}>
        <sphereGeometry args={[2.78 + volatility * 0.16, 48, 48]} />
        <meshBasicMaterial
          transparent
          color={riskColor}
          opacity={stressOpacity}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function AtmosphereGlow({ pulse }) {
  const outerRef = useRef();
  const innerRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk } = getSignals(pulse);

    if (outerRef.current) {
      outerRef.current.rotation.y = time * (0.003 + liquidity * 0.006);
      outerRef.current.rotation.x = Math.sin(time * 0.07) * 0.015 * volatility;
      outerRef.current.scale.setScalar(
        1 + Math.sin(time * 0.28) * 0.012 * liquidity
      );
    }

    if (innerRef.current) {
      innerRef.current.rotation.y = -time * (0.004 + risk * 0.006);
      innerRef.current.rotation.z = Math.cos(time * 0.08) * 0.014 * risk;
      innerRef.current.scale.setScalar(
        1.01 + Math.sin(time * 0.36) * 0.014 * volatility
      );
    }
  });

  const { risk, liquidity, volatility, volume } = getSignals(pulse);
  const palette = getMarketPalette(pulse);

  const outerColor = palette.atmosphere;
  const innerColor = palette.archival;

  return (
    <group>
      <mesh ref={outerRef}>
        <sphereGeometry args={[3.28 + volume * 0.22, 56, 56]} />
        <meshBasicMaterial
          transparent
          color={outerColor}
          opacity={0.03 + liquidity * 0.045 + risk * 0.02}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={innerRef}>
        <sphereGeometry args={[2.72 + volatility * 0.2, 44, 44]} />
        <meshBasicMaterial
          transparent
          color={innerColor}
          opacity={0.022 + liquidity * 0.03 + volatility * 0.018}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function VolumetricColorFog({ pulse }) {
  const primaryFogRef = useRef();
  const secondaryFogRef = useRef();
  const bloomRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk, volume } = getSignals(pulse);

    if (primaryFogRef.current) {
      primaryFogRef.current.rotation.y = time * (0.002 + liquidity * 0.006);
      primaryFogRef.current.rotation.x = Math.sin(time * 0.05) * 0.018 * volatility;
      primaryFogRef.current.scale.setScalar(
        1.05 + Math.sin(time * 0.22) * 0.018 + volume * 0.045
      );
      primaryFogRef.current.material.opacity =
        0.03 + liquidity * 0.055 + volume * 0.024;
    }

    if (secondaryFogRef.current) {
      secondaryFogRef.current.rotation.y = -time * (0.003 + risk * 0.008);
      secondaryFogRef.current.rotation.z = Math.cos(time * 0.06) * 0.018 * risk;
      secondaryFogRef.current.scale.setScalar(
        0.96 + Math.sin(time * 0.28) * 0.014 + volatility * 0.06
      );
      secondaryFogRef.current.material.opacity =
        0.022 + volatility * 0.045 + risk * 0.025;
    }

    if (bloomRef.current) {
      bloomRef.current.rotation.z = time * (0.004 + volume * 0.006);
      bloomRef.current.rotation.x = Math.sin(time * 0.08) * 0.016 * liquidity;
      bloomRef.current.scale.setScalar(
        0.88 + Math.sin(time * 0.36) * 0.012 + risk * 0.035
      );
      bloomRef.current.material.opacity =
        0.018 + volume * 0.034 + risk * 0.024;
    }
  });

  const palette = getMarketPalette(pulse);

  return (
    <group>
      <mesh ref={primaryFogRef}>
        <sphereGeometry args={[3.85, 64, 64]} />
        <meshBasicMaterial
          transparent
          color={palette.atmosphere}
          opacity={0.085}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={secondaryFogRef} rotation={[0.08, -0.04, 0.03]}>
        <sphereGeometry args={[3.42, 48, 48]} />
        <meshBasicMaterial
          transparent
          color={palette.secondary}
          opacity={0.065}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={bloomRef} rotation={[0.04, 0.07, -0.03]}>
        <sphereGeometry args={[2.95, 42, 42]} />
        <meshBasicMaterial
          transparent
          color={palette.accent}
          opacity={0.046}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
function CinematicEnergyBloom({ pulse }) {
  const bloomARef = useRef();
  const bloomBRef = useRef();
  const bloomCRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk, volume } = getSignals(pulse);

    if (bloomARef.current) {
      bloomARef.current.rotation.z = time * (0.012 + liquidity * 0.018);
      bloomARef.current.rotation.x = Math.sin(time * 0.13) * 0.025 * volatility;
      bloomARef.current.scale.setScalar(
        1 + Math.sin(time * 0.46) * 0.025 + volume * 0.04
      );
      bloomARef.current.material.opacity =
        0.045 + liquidity * 0.095 + volume * 0.045;
    }

    if (bloomBRef.current) {
      bloomBRef.current.rotation.z = -time * (0.009 + risk * 0.025);
      bloomBRef.current.rotation.y = Math.cos(time * 0.12) * 0.026 * risk;
      bloomBRef.current.scale.setScalar(
        1.04 + Math.sin(time * 0.34) * 0.018 + risk * 0.055
      );
      bloomBRef.current.material.opacity =
        0.03 + risk * 0.095 + volatility * 0.055;
    }

    if (bloomCRef.current) {
      bloomCRef.current.rotation.y = time * (0.006 + volatility * 0.018);
      bloomCRef.current.rotation.x = Math.sin(time * 0.1) * 0.018 * liquidity;
      bloomCRef.current.scale.setScalar(
        0.92 + Math.sin(time * 0.38) * 0.016 + volatility * 0.045
      );
      bloomCRef.current.material.opacity =
        0.024 + volatility * 0.07 + volume * 0.028;
    }
  });

  const palette = getMarketPalette(pulse);

  return (
    <group>
      <mesh ref={bloomARef} rotation={[Math.PI / 2, 0.04, 0.02]}>
        <torusGeometry args={[2.92, 0.007, 12, 220]} />
        <meshBasicMaterial
          transparent
          color={palette.secondary}
          opacity={0.018}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh ref={bloomBRef} rotation={[Math.PI / 2, -0.08, 0.11]}>
        <torusGeometry args={[3.18, 0.006, 12, 220]} />
        <meshBasicMaterial
          transparent
          color={palette.fracture}
          opacity={0.014}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh ref={bloomCRef} rotation={[Math.PI / 2, 0.18, -0.1]}>
        <torusGeometry args={[2.62, 0.014, 14, 200]} />
        <meshBasicMaterial
          transparent
          color={palette.accent}
          opacity={0.075}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
function VolatilityDistortionShell({ pulse }) {
  const shellRef = useRef();
  const wireRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, risk, liquidity, volume } = getSignals(pulse);

    if (shellRef.current) {
      shellRef.current.rotation.y = time * (0.006 + volatility * 0.018);
      shellRef.current.rotation.x = Math.sin(time * 0.11) * 0.026 * volatility;
      shellRef.current.rotation.z = Math.cos(time * 0.09) * 0.018 * risk;
      shellRef.current.scale.setScalar(
        1.02 + Math.sin(time * 0.52) * 0.012 + volatility * 0.055
      );
      shellRef.current.material.opacity =
        0.014 + volatility * 0.045 + risk * 0.022;
    }

    if (wireRef.current) {
      wireRef.current.rotation.y = -time * (0.004 + liquidity * 0.012);
      wireRef.current.rotation.x = Math.cos(time * 0.08) * 0.022 * risk;
      wireRef.current.scale.setScalar(
        1.01 + Math.sin(time * 0.34) * 0.01 + volume * 0.03
      );
      wireRef.current.material.opacity =
        0.02 + volatility * 0.04 + liquidity * 0.018;
    }
  });

  const palette = getMarketPalette(pulse);
  const shellColor = palette.secondary;
  const wireColor = palette.primary;

  return (
    <group>
      <mesh ref={shellRef}>
        <sphereGeometry args={[3.08, 64, 64]} />
        <meshBasicMaterial
          transparent
          color={shellColor}
          opacity={0.02}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={wireRef} rotation={[0.06, -0.04, 0.02]}>
        <sphereGeometry args={[3.02, 32, 32]} />
        <meshBasicMaterial
          transparent
          wireframe
          color={wireColor}
          opacity={0.018}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function DeepBackgroundEnergyField({ pulse }) {
  const fieldRef = useRef();
  const distantRef = useRef();
  const horizonRef = useRef();

  const fieldPositions = useMemo(() => {
    const count = 2200;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 5.2 + Math.random() * 8.4;
      const angle = Math.random() * Math.PI * 2;
      const verticalBias = Math.sin(angle * 2.0) * 0.55;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = (Math.random() - 0.5) * 7.6 + verticalBias;
      array[i * 3 + 2] = Math.sin(angle) * radius - 2.2 - Math.random() * 2.4;
    }

    return array;
  }, []);

  const distantPositions = useMemo(() => {
    const count = 1200;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 8.8 + Math.random() * 7.2;
      const angle = Math.random() * Math.PI * 2;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = (Math.random() - 0.5) * 8.8;
      array[i * 3 + 2] = Math.sin(angle) * radius - 5.4;
    }

    return array;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility, liquidity, risk, volume } = getSignals(pulse);

    if (fieldRef.current) {
      fieldRef.current.rotation.y = time * (0.0018 + liquidity * 0.004);
      fieldRef.current.rotation.x = Math.sin(time * 0.045) * 0.012 * volatility;
      fieldRef.current.rotation.z = Math.cos(time * 0.038) * 0.01 * risk;
      fieldRef.current.scale.setScalar(
        1 + Math.sin(time * 0.18) * 0.012 + volume * 0.018
      );
      fieldRef.current.material.opacity =
        0.052 + liquidity * 0.05 + volatility * 0.025;
    }

    if (distantRef.current) {
      distantRef.current.rotation.y = -time * (0.001 + volume * 0.0025);
      distantRef.current.rotation.x = Math.cos(time * 0.032) * 0.01 * liquidity;
      distantRef.current.material.opacity =
        0.03 + volume * 0.035 + risk * 0.016;
    }

    if (horizonRef.current) {
      horizonRef.current.rotation.z = time * (0.002 + volatility * 0.004);
      horizonRef.current.rotation.x = Math.sin(time * 0.05) * 0.018 * risk;
      horizonRef.current.scale.setScalar(
        1 + Math.sin(time * 0.24) * 0.018 + volatility * 0.035
      );
      horizonRef.current.material.opacity =
        0.02 + risk * 0.03 + liquidity * 0.018;
    }
  });

  const palette = getMarketPalette(pulse);

  return (
    <group>
      <Points ref={fieldRef} positions={fieldPositions} stride={3}>
        <PointMaterial
          transparent
          color={palette.atmosphere}
          size={0.011}
          sizeAttenuation
          depthWrite={false}
          opacity={0.11}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points ref={distantRef} positions={distantPositions} stride={3}>
        <PointMaterial
          transparent
          color={palette.ghost}
          size={0.0065}
          sizeAttenuation
          depthWrite={false}
          opacity={0.07}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <mesh ref={horizonRef} position={[0, -0.06, -3.8]} rotation={[Math.PI / 2, 0.08, -0.04]}>
        <torusGeometry args={[4.9, 0.022, 18, 260]} />
        <meshBasicMaterial
          transparent
          color={palette.secondary}
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
function MemoryFieldDistortion({ pulse }) {
  const groupRef = useRef();
  const ribbonRef = useRef();
  const particleRef = useRef();

  const ribbons = useMemo(() => {
    const result = [];
    const lineCount = 20;
    const segmentCount = 130;

    for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
      const phase = lineIndex / Math.max(1, lineCount - 1);
      const vertical = (phase - 0.5) * 4.6;
      const points = [];

      for (let i = 0; i < segmentCount; i++) {
        const t = i / Math.max(1, segmentCount - 1);

        const x = (t - 0.5) * 10.8;

        const center = Math.sin(t * Math.PI);

        const wave =
          Math.sin(t * Math.PI * 4.2 + phase * Math.PI * 5.2) * 0.22 +
          Math.cos(t * Math.PI * 9.4 - phase * Math.PI * 3.7) * 0.085;

        const y =
          vertical +
          wave * (0.45 + center * 0.8);

        const z =
          -1.8 +
          center * 1.45 +
          Math.sin(phase * Math.PI) * 0.32;

        points.push(
          new THREE.Vector3(x, y, z)
        );
      }

      result.push({
        points,
        phase,
        width:
          0.18 +
          Math.sin(phase * Math.PI) * 0.42,
      });
    }

    return result;
  }, []);

  const fieldParticles = useMemo(() => {
    const count = 2200;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;

      const lane = Math.sin(t * Math.PI * 18.0);

      const x = (Math.random() - 0.5) * 10.6;

      const y =
        lane * 1.75 +
        (Math.random() - 0.5) * 3.2;

      const center =
        Math.max(0, 1 - Math.abs(x) / 5.3);

      const z =
        -1.45 +
        center * 1.3 +
        Math.random() * 0.65;

      array[i * 3] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = z;
    }

    return array;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    const {
      volatility,
      liquidity,
      risk,
      volume,
    } = getSignals(pulse);

    if (groupRef.current) {
      groupRef.current.rotation.x =
        -0.24 +
        Math.sin(time * 0.05) *
          0.035 *
          volatility;

      groupRef.current.rotation.y =
        Math.sin(time * 0.04) *
        0.055 *
        liquidity;

      groupRef.current.rotation.z =
        Math.cos(time * 0.045) *
        0.035 *
        risk;

      groupRef.current.scale.setScalar(
        1 +
          Math.sin(time * 0.18) * 0.018 +
          volume * 0.035
      );
    }

    if (ribbonRef.current) {
      ribbonRef.current.rotation.y =
        time *
        (0.004 + liquidity * 0.012);

      ribbonRef.current.position.y =
        Math.sin(time * 0.2) * 0.035;
    }

    if (particleRef.current) {
      particleRef.current.rotation.y =
        -time *
        (0.006 + liquidity * 0.016);

      particleRef.current.rotation.z =
        Math.sin(time * 0.08) *
        0.018 *
        volatility;

      particleRef.current.material.opacity =
        0.24 +
        volume * 0.2 +
        volatility * 0.12;
    }
  });

  const {
    volatility,
    liquidity,
    risk,
    volume,
  } = getSignals(pulse);

  const palette = getMarketPalette(pulse);

  return (
    <group
      ref={groupRef}
      position={[0, -0.1, 0.38]}
scale={[1.18, 0.62, 1]}
    >
      <group ref={ribbonRef}>
        {ribbons.map((ribbon, index) => {
          const isWarm = index % 5 === 0;

          const isStress =
            index % 7 === 0 &&
            risk > 0.32;

          const color = isStress
            ? palette.fracture
            : isWarm
            ? palette.accent
            : palette.secondary;

          const opacity = isStress
            ? 0.18 + risk * 0.22
            : isWarm
            ? 0.13 + volume * 0.18
            : 0.12 +
              liquidity * 0.22 +
              volatility * 0.08;

          return (
            <Line
              key={`memory-field-distortion-${index}`}
              points={ribbon.points}
              color={color}
              lineWidth={
                ribbon.width +
                volatility * 0.44 +
                liquidity * 0.18
              }
              transparent
              opacity={opacity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          );
        })}
      </group>

      <Points
        ref={particleRef}
        positions={fieldParticles}
        stride={3}
      >
        <PointMaterial
          transparent
          color={palette.accent}
          size={0.014 + volume * 0.009}
          sizeAttenuation
          depthWrite={false}
          opacity={0.34}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}
function VisualInterpretationLegend({ pulse, history }) {
  const palette = getMarketPalette(pulse);
  const { risk, liquidity, volatility, volume } = getSignals(pulse);
  const points = Array.isArray(history?.points) ? history.points : [];
  const anomalyCount = Array.isArray(history?.anomalies) ? history.anomalies.length : 0;

  const marketMood =
    risk > 0.62
      ? "Stress / contraction"
      : volatility > 0.62
      ? "Volatile / fractured"
      : liquidity > 0.62
      ? "Liquid / flowing"
      : volume > 0.62
      ? "Dense / active"
      : "Balanced memory";

  const legendItems = [
    { label: "Orbit", color: palette.orbit, value: "price" },
    { label: "Nodes", color: palette.secondary, value: "moments" },
    { label: "Flow", color: palette.secondary, value: "liquidity" },
    { label: "Dust", color: palette.particles, value: "volume" },
    { label: "Ghost", color: palette.ghost, value: "archive" },
    { label: "Fracture", color: palette.fracture, value: "stress" },
    { label: "Beacon", color: palette.accent, value: "live" },
  ];

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden w-[min(980px,calc(100%-3rem))] -translate-x-1/2 rounded-full border border-white/10 bg-[#050609]/48 px-3.5 py-2 text-white shadow-[0_14px_48px_rgba(0,0,0,0.26)] backdrop-blur-2xl xl:block">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-[150px] items-center gap-2 border-r border-white/10 pr-3">
          <span
            className="h-2 w-2 rounded-full shadow-[0_0_16px_currentColor]"
            style={{ backgroundColor: palette.primary, color: palette.primary }}
          />
          <div>
            <p className="mono-font text-[0.38rem] uppercase tracking-[0.16em] text-white/32">
              Interpretation
            </p>
            <p className="text-[0.64rem] font-medium leading-3 text-white/72">
              {marketMood}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center gap-2 overflow-hidden">
          {legendItems.map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_14px_currentColor]"
                style={{ backgroundColor: item.color, color: item.color }}
              />
              <p className="text-[0.56rem] font-medium leading-3 text-white/70">
                {item.label}
              </p>
              <p className="mono-font hidden text-[0.36rem] uppercase tracking-[0.1em] text-white/28 2xl:block">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex min-w-[190px] items-center justify-end gap-2 border-l border-white/10 pl-3">
          <p className="mono-font text-[0.42rem] uppercase tracking-[0.13em] text-white/34">
            R {formatTooltipPercent(risk)} · V {formatTooltipPercent(volatility)} · L {formatTooltipPercent(liquidity)}
          </p>
          <p className="mono-font text-[0.42rem] uppercase tracking-[0.13em] text-white/30">
            {points.length || "—"} pts · {anomalyCount} anom
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BTCMemoryOrbit({ pulse, history }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [orbitArchive, setOrbitArchive] = useState([]);
  const [reconstructionKey, setReconstructionKey] = useState(0);
  const previousOrbitSnapshotRef = useRef(null);

  const historySignature = useMemo(() => {
    const points = Array.isArray(history?.points) ? history.points : [];

    if (points.length < 4) {
      return `fallback-${history?.range || "none"}`;
    }

    const first = points[0]?.timestamp || "start";
    const last = points[points.length - 1]?.timestamp || "end";

    return `${history?.range || "range"}-${points.length}-${first}-${last}`;
  }, [history]);

  const currentOrbitSnapshot = useMemo(
    () => createOrbitSnapshot(pulse, history, historySignature),
    [pulse, history, historySignature]
  );

  useEffect(() => {
    const previousSnapshot = previousOrbitSnapshotRef.current;

    if (
      previousSnapshot &&
      previousSnapshot.signature !== currentOrbitSnapshot.signature
    ) {
      setOrbitArchive((currentArchive) => {
        const withoutDuplicate = currentArchive.filter(
          (item) => item.signature !== previousSnapshot.signature
        );

        return [previousSnapshot, ...withoutDuplicate].slice(0, 4);
      });

      setReconstructionKey((currentKey) => currentKey + 1);
    }

    previousOrbitSnapshotRef.current = currentOrbitSnapshot;
  }, [currentOrbitSnapshot]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#030406]">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.03)_44%,rgba(3,4,6,0.84)_100%)]" />

      <div className="pointer-events-none absolute left-5 top-5 z-20 hidden rounded-full border border-white/8 bg-black/18 px-3 py-1.5 backdrop-blur-xl md:flex">
        <p className="mono-font text-[0.4rem] uppercase tracking-[0.16em] text-white/34">
          Drag to inspect · Scroll to zoom
        </p>
      </div>

      <VisualInterpretationLegend pulse={pulse} history={history} />

      <Canvas
        dpr={[1, 1.35]}
        camera={{
          position: [0, 0.12, 7.55],
fov: 53,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#030406"]} />
        <fog attach="fog" args={["#030406", 5.2, 13]} />

        <ambientLight intensity={0.58} />

        <pointLight
          position={[3.5, 2.5, 4]}
          intensity={1.55}
          color={getMarketPalette(pulse).ghost}
        />
        <pointLight
          position={[-3, -2, 4]}
          intensity={1.05}
          color={getMarketPalette(pulse).accent}
        />

        <OrbitControls
          enablePan={false}
          enableZoom
          enableRotate
          minDistance={4.2}
          maxDistance={8.2}
          rotateSpeed={0.42}
          zoomSpeed={0.55}
          dampingFactor={0.08}
          enableDamping
        />

        <DeepBackgroundEnergyField pulse={pulse} />

        <group position={[0, -0.18, 0]} scale={1.24}>
          <MarketDust pulse={pulse} />
          <AtmosphereGlow pulse={pulse} />
          <VolumetricColorFog pulse={pulse} />
<MemoryFieldDistortion pulse={pulse} />
<CinematicEnergyBloom pulse={pulse} />
          <VolatilityDistortionShell pulse={pulse} />
          <RiskHalo pulse={pulse} />
          <TemporalMemorySystem
            pulse={pulse}
            history={history}
            orbitArchive={orbitArchive}
            reconstructionKey={reconstructionKey}
            hoveredPoint={hoveredPoint}
            setHoveredPoint={setHoveredPoint}
          />
          <MarketCore pulse={pulse} />
        </group>
      </Canvas>
    </div>
  );
}