import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, PointMaterial, Points, Text } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import buildBTCVisualState from "../systems/buildBTCVisualState";

const PALETTE = {
  space: "#02040A",
  clarity: "#FFF6DF",
  glass: "#BDEFFF",
  liquidity: "#50E7FF",
  liquiditySoft: "#A7F2FF",
  recovery: "#FFD36A",
  amber: "#FF8A2A",
  risk: "#FF3D6E",
  violet: "#8D6BFF",
  violetSoft: "#D8CCFF",
  plasma: "#FF6AD5",
  emerald: "#7CFFB2",
  royal: "#67A7FF",
  pearl: "#F5F8FF",
};

const clamp = (value, min = 0, max = 1) => {
  return Math.min(max, Math.max(min, value));
};

const num = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const noise = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return x * x * (3 - 2 * x);
};

function formatDate(timestamp) {
  if (!timestamp) return "Synthetic memory";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price) {
  if (price === null || typeof price === "undefined" || price === "") return "$—";

  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return "$—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value) {
  const valueNumber = Number(value);
  if (!Number.isFinite(valueNumber)) return "—";

  return `${Math.round(clamp(valueNumber) * 100)}%`;
}

function normalizeHistory(history) {
  const raw = Array.isArray(history?.points) ? history.points : [];

  if (raw.length >= 4) {
    const prices = raw
      .map((point) => num(point.price, NaN))
      .filter(Number.isFinite);

    const volumes = raw
      .map((point) => num(point.volume, NaN))
      .filter(Number.isFinite);

    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 1;
    const minVolume = volumes.length ? Math.min(...volumes) : 0;
    const maxVolume = volumes.length ? Math.max(...volumes) : 1;

    return raw.map((point, index) => {
      const price = num(point.price, NaN);
      const previousPrice = index > 0 ? num(raw[index - 1]?.price, price) : price;
      const progress = num(point.progress, index / Math.max(1, raw.length - 1));
      const fallbackDirection = price >= previousPrice ? 1 : -1;

      const priceNormalized = Number.isFinite(Number(point.priceNormalized))
        ? clamp(Number(point.priceNormalized))
        : Number.isFinite(price) && maxPrice !== minPrice
        ? clamp((price - minPrice) / (maxPrice - minPrice))
        : 0.5;

      const volumeNormalized = Number.isFinite(Number(point.volumeNormalized))
        ? clamp(Number(point.volumeNormalized))
        : maxVolume !== minVolume
        ? clamp((num(point.volume, minVolume) - minVolume) / (maxVolume - minVolume))
        : 0.36;

      const localReturn =
        Number.isFinite(price) && Number.isFinite(previousPrice) && previousPrice !== 0
          ? Math.abs((price - previousPrice) / previousPrice)
          : 0;

      const localVolatility = Number.isFinite(Number(point.localVolatility))
        ? clamp(Number(point.localVolatility))
        : clamp(localReturn * 28);

      return {
        ...point,
        index,
        progress,
        timestamp: point.timestamp || point.date || point.time || null,
        price: Number.isFinite(price) ? price : null,
        direction: num(point.direction, fallbackDirection),
        priceNormalized,
        volumeNormalized,
        localVolatility,
      };
    });
  }

  return Array.from({ length: 180 }, (_, index) => {
    const progress = index / 179;

    return {
      index,
      progress,
      timestamp: null,
      price: null,
      direction: Math.sin(progress * Math.PI * 8.2) > 0 ? 1 : -1,
      priceNormalized: clamp(
        0.5 +
          Math.sin(progress * Math.PI * 2.3) * 0.22 +
          Math.sin(progress * Math.PI * 7.4) * 0.08
      ),
      volumeNormalized: clamp(
        0.34 +
          Math.sin(progress * Math.PI * 5.1) * 0.24 +
          noise(index + 7) * 0.2
      ),
      localVolatility: clamp(
        0.18 + Math.abs(Math.sin(progress * Math.PI * 8.5)) * 0.34
      ),
    };
  });
}

function enrichVisualState(baseState, points) {
  const recent = points.slice(-Math.min(24, points.length));

  const volumeAverage =
    recent.reduce((sum, point) => sum + point.volumeNormalized, 0) /
    Math.max(1, recent.length);

  const volatilityAverage =
    recent.reduce((sum, point) => sum + point.localVolatility, 0) /
    Math.max(1, recent.length);

  const negativeShare =
    recent.filter((point) => point.direction < 0).length /
    Math.max(1, recent.length);

  const risk = clamp(num(baseState?.risk, negativeShare * 0.64 + volatilityAverage * 0.42));
  const volume = clamp(num(baseState?.volume, volumeAverage));
  const volatility = clamp(num(baseState?.volatility, volatilityAverage));
  const liquidity = clamp(num(baseState?.liquidity, 1 - risk * 0.52 + volume * 0.16));
  const health = clamp(num(baseState?.health, 1 - risk * 0.48 + liquidity * 0.18));

  const moodLabel =
    risk > 0.62
      ? "Risk Compression"
      : volume > 0.62
      ? "High Density Flow"
      : liquidity > 0.58
      ? "Liquid Harmony"
      : "Balanced Flow";

  return {
    ...baseState,
    risk,
    volume,
    volatility,
    liquidity,
    health,
    colors: {
      ...PALETTE,
      ...(baseState?.colors || {}),
      risk: PALETTE.risk,
      recovery: PALETTE.recovery,
      volatility: PALETTE.amber,
      liquidity: PALETTE.liquidity,
      liquiditySoft: PALETTE.liquiditySoft,
      clarity: PALETTE.clarity,
      plasma: PALETTE.plasma,
      emerald: PALETTE.emerald,
      royal: PALETTE.royal,
      pearl: PALETTE.pearl,
    },
    core: {
      ...(baseState?.core || {}),
      color: risk > 0.58 ? PALETTE.risk : volume > 0.58 ? PALETTE.recovery : PALETTE.liquiditySoft,
      innerColor: risk > 0.58 ? PALETTE.risk : volume > 0.58 ? PALETTE.recovery : PALETTE.clarity,
      pulseSpeed: 0.85 + volatility * 1.45 + volume * 0.5,
      compression: 0.16 + risk * 0.28,
    },
    mood: baseState?.mood || {
      label: moodLabel,
    },
    summary:
      baseState?.summary ||
      "BTC memory becomes a living organism: price curves the orbit, volume creates granular density, risk compresses the field, and liquidity opens vascular flow.",
  };
}

function smoothValue(points, index, key, radius = 3) {
  let sum = 0;
  let weightSum = 0;

  for (let offset = -radius; offset <= radius; offset += 1) {
    const sample = points[index + offset];
    if (!sample) continue;

    const weight = radius + 1 - Math.abs(offset);
    sum += num(sample[key], 0.5) * weight;
    weightSum += weight;
  }

  return weightSum ? sum / weightSum : num(points[index]?.[key], 0.5);
}

function orbitPoint(point, points, visualState) {
  const index = point.index ?? 0;
  const progress = num(point.progress, index / Math.max(1, points.length - 1));
  const angle = progress * Math.PI * 2;

  const price = smoothValue(points, index, "priceNormalized", 3);
  const volume = smoothValue(points, index, "volumeNormalized", 2);
  const volatility = smoothValue(points, index, "localVolatility", 2);

  const pressure = point.direction < 0 ? -visualState.risk * 0.05 : visualState.liquidity * 0.035;

  const radius =
    2.05 +
    (price - 0.5) * 0.72 +
    volume * 0.18 +
    Math.sin(progress * Math.PI * 11.2) * volatility * 0.07 +
    pressure;

  const y =
    (price - 0.5) * 0.56 +
    Math.sin(progress * Math.PI * 3.4) * visualState.liquidity * 0.06 +
    Math.cos(progress * Math.PI * 8.4) * volatility * 0.08;

  return new THREE.Vector3(
    Math.cos(angle) * radius,
    y,
    Math.sin(angle) * radius
  );
}

function curveToCore(start, end, bend = 0.15, lift = 0.05, side = 1) {
  const mid = start.clone().lerp(end, 0.5);
  const radial = new THREE.Vector3(mid.x, 0, mid.z).normalize();
  const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();

  return [
    start,
    start
      .clone()
      .lerp(end, 0.32)
      .add(tangent.clone().multiplyScalar(side * bend))
      .add(new THREE.Vector3(0, lift, 0)),
    start
      .clone()
      .lerp(end, 0.68)
      .add(radial.clone().multiplyScalar(-bend * 0.35))
      .add(new THREE.Vector3(0, -lift * 0.6, 0)),
    end,
  ];
}

function Atmosphere({ visualState }) {
  const ref = useRef();

  const particles = useMemo(() => {
    const count = 620;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const angle = noise(i + 10) * Math.PI * 2;
      const radius = 2.45 + noise(i + 1000) * 2.55;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (noise(i + 2000) - 0.5) * 2.35;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * (0.0018 + visualState.liquidity * 0.0025);
  });

  return (
    <Points ref={ref} positions={particles} stride={3}>
      <PointMaterial
        transparent
        color={visualState.colors.liquiditySoft}
        size={0.01 + visualState.volume * 0.004}
        sizeAttenuation
        depthWrite={false}
        opacity={0.15 + visualState.volume * 0.08}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function CoordinateField({ visualState }) {
  const lines = useMemo(() => {
    const out = [];
    const size = 5.6;
    const step = 0.7;
    const count = Math.floor(size / step);

    for (let i = -count; i <= count; i += 1) {
      const offset = i * step;
      const major = i === 0 || Math.abs(i) % 3 === 0;

      out.push({
        id: `grid-x-${i}`,
        points: [new THREE.Vector3(-size, -0.82, offset), new THREE.Vector3(size, -0.82, offset)],
        opacity: major ? 0.045 : 0.018,
        width: major ? 0.12 : 0.045,
      });

      out.push({
        id: `grid-z-${i}`,
        points: [new THREE.Vector3(offset, -0.82, -size), new THREE.Vector3(offset, -0.82, size)],
        opacity: major ? 0.045 : 0.018,
        width: major ? 0.12 : 0.045,
      });
    }

    return out;
  }, []);

  return (
    <group>
      {lines.map((line) => (
        <Line
          key={line.id}
          points={line.points}
          color={visualState.colors.liquiditySoft}
          lineWidth={line.width}
          transparent
          opacity={line.opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ))}
    </group>
  );
}

function ChromaticMemoryDust({ visualState, points }) {
  const ref = useRef();

  const layers = useMemo(() => {
    const count = 920;
    const positions = new Float32Array(count * 3);
    const accentPositions = new Float32Array(Math.floor(count * 0.34) * 3);

    for (let i = 0; i < count; i += 1) {
      const source = points[i % Math.max(1, points.length)] || {};
      const progress = num(source.progress, i / count);
      const angle = progress * Math.PI * 2 + (noise(i + 12) - 0.5) * 0.65;
      const radius = 1.45 + noise(i + 80) * 2.75 + num(source.volumeNormalized, 0.4) * 0.34;
      const height = (noise(i + 180) - 0.5) * (0.9 + visualState.volatility * 0.55);
      const swirl = Math.sin(progress * Math.PI * 6 + i * 0.11) * 0.16 * visualState.liquidity;

      positions[i * 3] = Math.cos(angle + swirl) * radius;
      positions[i * 3 + 1] = height + Math.sin(angle * 1.7) * 0.05;
      positions[i * 3 + 2] = Math.sin(angle + swirl) * radius;

      if (i < accentPositions.length / 3) {
        const accentRadius = 1.85 + noise(i + 260) * 1.95;
        const accentAngle = angle + Math.sin(i * 0.13) * 0.3;
        accentPositions[i * 3] = Math.cos(accentAngle) * accentRadius;
        accentPositions[i * 3 + 1] = (noise(i + 300) - 0.5) * 0.62;
        accentPositions[i * 3 + 2] = Math.sin(accentAngle) * accentRadius;
      }
    }

    return { positions, accentPositions };
  }, [points, visualState]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.rotation.y = time * (0.002 + visualState.liquidity * 0.006);
    ref.current.rotation.x = Math.sin(time * 0.05) * 0.012 * visualState.volatility;
  });

  const primaryColor = visualState.risk > 0.58
    ? visualState.colors.plasma
    : visualState.volume > 0.58
    ? visualState.colors.recovery
    : visualState.colors.royal;

  const accentColor = visualState.liquidity > 0.54
    ? visualState.colors.liquiditySoft
    : visualState.risk > 0.58
    ? visualState.colors.risk
    : visualState.colors.emerald;

  return (
    <group ref={ref}>
      <Points positions={layers.positions} stride={3}>
        <PointMaterial
          transparent
          color={primaryColor}
          size={0.0048 + visualState.volume * 0.0028}
          sizeAttenuation
          depthWrite={false}
          opacity={0.14 + visualState.volume * 0.08 + visualState.volatility * 0.04}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      <Points positions={layers.accentPositions} stride={3}>
        <PointMaterial
          transparent
          color={accentColor}
          size={0.006 + visualState.liquidity * 0.003}
          sizeAttenuation
          depthWrite={false}
          opacity={0.16 + visualState.liquidity * 0.1}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

function Core({ visualState }) {
  const coreRef = useRef();
  const shellRef = useRef();
  const membraneRef = useRef();
  const symbolRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (coreRef.current) {
      coreRef.current.rotation.y += 0.002 + visualState.volatility * 0.0018;
      coreRef.current.rotation.x = Math.sin(time * 0.28) * 0.04;
      coreRef.current.scale.setScalar(
        0.92 + Math.sin(time * visualState.core.pulseSpeed) * visualState.core.compression * 0.06
      );
    }

    if (shellRef.current) {
      shellRef.current.rotation.y += 0.0012 + visualState.liquidity * 0.001;
      shellRef.current.material.opacity = 0.035 + visualState.liquidity * 0.018 + visualState.volume * 0.012;
    }

    if (membraneRef.current) {
      membraneRef.current.rotation.y -= 0.0022 + visualState.liquidity * 0.0012;
      membraneRef.current.rotation.x = Math.sin(time * 0.22) * 0.035;
    }

    if (symbolRef.current) {
      symbolRef.current.rotation.set(0, 0, Math.sin(time * 0.2) * 0.004);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = time * (0.12 + visualState.liquidity * 0.18);
      ringRef.current.rotation.x = Math.sin(time * 0.45) * 0.12;
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1.08 + visualState.volume * 0.16, 64, 64]} />
        <meshBasicMaterial
          transparent
          color={visualState.risk > 0.58 ? visualState.colors.plasma : visualState.liquidity > 0.55 ? visualState.colors.liquidity : visualState.colors.recovery}
          opacity={0.028 + visualState.volume * 0.018 + visualState.risk * 0.012}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.78, 72, 72]} />
        <meshBasicMaterial
          transparent
          color={visualState.core.color}
          opacity={0.035 + visualState.volume * 0.02}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={shellRef}>
        <sphereGeometry args={[0.57, 72, 72]} />
        <meshPhysicalMaterial
          transparent
          color={visualState.colors.liquiditySoft}
          emissive={visualState.colors.liquiditySoft}
          emissiveIntensity={0.12 + visualState.liquidity * 0.14}
          opacity={0.045}
          roughness={0.05}
          metalness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.03}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={membraneRef}>
        <icosahedronGeometry args={[0.55, 7]} />
        <meshBasicMaterial
          wireframe
          transparent
          color={visualState.colors.clarity}
          opacity={0.09}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.31, 48, 48]} />
        <meshBasicMaterial
          transparent
          color={visualState.core.innerColor}
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.31, 16]} />
        <meshStandardMaterial
          color={visualState.colors.clarity}
          emissive={visualState.core.color}
          emissiveIntensity={0.86 + visualState.health * 0.34}
          roughness={0.23}
          metalness={0.45}
        />
      </mesh>

      <Text
        ref={symbolRef}
        position={[0, 0.006, 0.385]}
        fontSize={0.45}
        anchorX="center"
        anchorY="middle"
        color="#080402"
        fillOpacity={0.96}
        outlineWidth={0.004}
        outlineColor="#FFE6A3"
        renderOrder={40}
        material-depthTest={false}
        material-transparent
        material-opacity={0.92}
      >
        ₿
      </Text>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0.12, 0]}>
        <torusGeometry args={[0.43, 0.004, 14, 180]} />
        <meshBasicMaterial
          transparent
          color={visualState.core.innerColor}
          opacity={0.13 + visualState.liquidity * 0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function MemoryOrbit({ visualState, points }) {
  const ref = useRef();

  const orbit = useMemo(() => {
    const main = points.map((point) => orbitPoint(point, points, visualState));
    if (main.length > 1) main.push(main[0].clone());

    const glow = main.map((point, index) => {
      const progress = index / Math.max(1, main.length - 1);
      return point.clone().multiplyScalar(1.018).add(new THREE.Vector3(0, Math.sin(progress * Math.PI * 3.5) * 0.03, 0));
    });

    const pressure = main.map((point, index) => {
      const progress = index / Math.max(1, main.length - 1);
      return new THREE.Vector3(
        point.x * (1 - visualState.risk * 0.025),
        point.y * 0.93 + Math.sin(progress * Math.PI * 8) * visualState.volatility * 0.018,
        point.z * (1 - visualState.risk * 0.025)
      );
    });

    return { main, glow, pressure };
  }, [points, visualState]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.025) * 0.006 * visualState.liquidity;
  });

  return (
    <group ref={ref}>
      <Line
        points={orbit.glow}
        color={visualState.colors.recovery}
        lineWidth={0.74 + visualState.volume * 0.22}
        transparent
        opacity={0.035 + visualState.volume * 0.025}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />

      <Line
        points={orbit.pressure}
        color={visualState.colors.risk}
        lineWidth={0.2 + visualState.risk * 0.22}
        transparent
        opacity={0.025 + visualState.risk * 0.035}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />

      <Line
        points={orbit.main}
        color={visualState.colors.liquiditySoft}
        lineWidth={0.42 + visualState.volume * 0.16}
        transparent
        opacity={0.18 + visualState.liquidity * 0.07}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />

      <Line
        points={orbit.main}
        color={visualState.colors.clarity}
        lineWidth={0.035}
        transparent
        opacity={0.13}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </group>
  );
}

function WarmDataFabric({ visualState, points }) {
  const ref = useRef();

  const fabric = useMemo(() => {
    const amber = [];
    const rose = [];
    const gold = [];

    points
      .map((point, index) => ({
        point,
        index,
        activity:
          point.volumeNormalized * 0.62 +
          point.localVolatility * 0.52 +
          (point.direction < 0 ? visualState.risk * 0.32 : visualState.liquidity * 0.22),
      }))
      .filter((item, index) => item.activity > 0.24 || index % 7 === 0)
      .slice(-150)
      .forEach(({ point, index }) => {
        const anchor = orbitPoint(point, points, visualState);
        const radial = new THREE.Vector3(anchor.x, 0, anchor.z).normalize();
        const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
        const count = Math.round(9 + point.volumeNormalized * 34 + point.localVolatility * 22);
        const length = 0.22 + point.volumeNormalized * 0.46 + visualState.liquidity * 0.12;
        const width = 0.07 + point.volumeNormalized * 0.18 + point.localVolatility * 0.13;

        for (let i = 0; i < count; i += 1) {
          const t = i / Math.max(1, count - 1);
          const wave = Math.sin(t * Math.PI * 9 + index * 0.23);
          const ridge = Math.cos(t * Math.PI * 5.2 - index * 0.19);
          const grain = noise((index + 1) * (i + 3));
          const local = anchor
            .clone()
            .add(tangent.clone().multiplyScalar((t - 0.5) * length + wave * width * 0.42))
            .add(radial.clone().multiplyScalar(-0.08 - visualState.risk * 0.055 + ridge * width * 0.7))
            .add(new THREE.Vector3(0, wave * width * 0.36 + (grain - 0.5) * point.localVolatility * 0.15, 0));

          amber.push(local.x, local.y, local.z);
          if (point.direction < 0 && i % 2 === 0) rose.push(local.x, local.y, local.z);
          if (point.direction >= 0 && point.volumeNormalized > 0.44 && i % 3 === 0) gold.push(local.x, local.y, local.z);
        }
      });

    return {
      amber: new Float32Array(amber),
      rose: new Float32Array(rose),
      gold: new Float32Array(gold),
    };
  }, [points, visualState]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(time * 0.03) * 0.007 * visualState.liquidity;
    ref.current.rotation.x = Math.cos(time * 0.026) * 0.007 * visualState.volatility;
  });

  return (
    <group ref={ref}>
      {fabric.amber.length > 0 && (
        <Points positions={fabric.amber} stride={3}>
          <PointMaterial
            transparent
            color={visualState.colors.volatility}
            size={0.0085 + visualState.volume * 0.0048}
            sizeAttenuation
            depthWrite={false}
            opacity={0.52 + visualState.volume * 0.16 + visualState.volatility * 0.08}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}

      {fabric.rose.length > 0 && (
        <Points positions={fabric.rose} stride={3}>
          <PointMaterial
            transparent
            color={visualState.colors.risk}
            size={0.009 + visualState.volatility * 0.0046}
            sizeAttenuation
            depthWrite={false}
            opacity={0.38 + visualState.risk * 0.18}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}

      {fabric.gold.length > 0 && (
        <Points positions={fabric.gold} stride={3}>
          <PointMaterial
            transparent
            color={visualState.colors.recovery}
            size={0.0092 + visualState.volume * 0.0046}
            sizeAttenuation
            depthWrite={false}
            opacity={0.42 + visualState.volume * 0.18}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}
    </group>
  );
}

function DensityNebula({ visualState, points }) {
  const positions = useMemo(() => {
    const selected = points.filter(
      (point, index) => index % 2 === 0 && point.volumeNormalized * 0.7 + point.localVolatility * 0.36 > 0.22
    );
    const count = Math.min(1500, Math.max(420, selected.length * 10));
    const output = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const point = selected[i % Math.max(1, selected.length)] || points[i % points.length];
      const anchor = orbitPoint(point, points, visualState);
      const radial = new THREE.Vector3(anchor.x, 0, anchor.z).normalize();
      const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
      const spread = 0.06 + point.volumeNormalized * 0.28 + point.localVolatility * 0.12;
      const spiral = noise(i + 11) * Math.PI * 2;
      const offset = tangent
        .clone()
        .multiplyScalar(Math.cos(spiral) * spread * noise(i + 21))
        .add(radial.clone().multiplyScalar(-0.04 + Math.sin(spiral) * spread * 0.55))
        .add(new THREE.Vector3(0, Math.cos(spiral * 1.4) * spread * 0.34, 0));

      output[i * 3] = anchor.x + offset.x;
      output[i * 3 + 1] = anchor.y + offset.y;
      output[i * 3 + 2] = anchor.z + offset.z;
    }

    return output;
  }, [points, visualState]);

  return (
    <Points positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={visualState.colors.liquiditySoft}
        size={0.0072 + visualState.volume * 0.0042}
        sizeAttenuation
        depthWrite={false}
        opacity={0.28 + visualState.volume * 0.18 + visualState.liquidity * 0.08}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function VascularNetwork({ visualState, points }) {
  const ref = useRef();
  const flowRef = useRef();

  const network = useMemo(() => {
    const active = points
      .map((point, index) => ({
        point,
        index,
        activity:
          point.volumeNormalized * 0.68 +
          point.localVolatility * 0.56 +
          (point.direction < 0 ? visualState.risk * 0.42 : visualState.liquidity * 0.32),
        position: orbitPoint(point, points, visualState),
      }))
      .filter(
        (item, index) =>
          item.activity > 0.26 ||
          item.point.volumeNormalized > 0.42 ||
          item.point.localVolatility > 0.36 ||
          index % 9 === 0
      )
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 54)
      .sort((a, b) => a.index - b.index);

    const veins = [];
    const crossWebs = [];
    const particles = [];
    const pulseParticles = [];

    active.forEach((anchor, anchorIndex) => {
      const radial = new THREE.Vector3(anchor.position.x, 0, anchor.position.z).normalize();
      const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
      const isRisk = anchor.point.direction < 0;
      const isRecovery = !isRisk && anchor.point.volumeNormalized > 0.54;
      const isLiquid = !isRisk && visualState.liquidity > 0.48;

      const color = isRisk
        ? visualState.colors.risk
        : isRecovery
        ? visualState.colors.recovery
        : isLiquid
        ? visualState.colors.liquiditySoft
        : visualState.colors.clarity;

      const glowColor = isRisk
        ? visualState.colors.volatility
        : isRecovery
        ? visualState.colors.recovery
        : visualState.colors.liquidity;

      const coreRadius = 0.42 + anchor.point.volumeNormalized * 0.12 + visualState.liquidity * 0.06;
      const coreTouch = radial.clone().multiplyScalar(coreRadius);
      coreTouch.y = anchor.position.y * (0.12 + visualState.liquidity * 0.08);

      const bend = 0.12 + anchor.point.localVolatility * 0.2 + visualState.risk * 0.08;
      const lift = anchor.point.localVolatility * 0.16 + anchor.point.volumeNormalized * 0.06;
      const side = anchorIndex % 2 === 0 ? 1 : -1;
      const curve = [];
      const segments = 13;

      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const eased = smoothstep(0, 1, t);
        const base = anchor.position.clone().lerp(coreTouch, eased);
        const wave = Math.sin(t * Math.PI * (2.2 + anchor.point.localVolatility * 3.8) + anchor.index * 0.17);
        const compression = isRisk ? 1.2 : 0.75;
        const gracefulFlow = isLiquid ? 0.55 : 1;
        const tangentOffset = tangent.clone().multiplyScalar(wave * bend * (1 - t) * side * gracefulFlow);
        const radialPulse = radial.clone().multiplyScalar(Math.sin(t * Math.PI) * (0.08 + anchor.point.volumeNormalized * 0.09) * compression);
        const verticalPulse = new THREE.Vector3(
          0,
          Math.cos(t * Math.PI * 2.6 + anchor.index * 0.11) * lift * (1 - t * 0.55),
          0
        );

        curve.push(base.add(tangentOffset).add(radialPulse).add(verticalPulse));
      }

      const intensity = clamp(anchor.activity);

      veins.push({
        id: `primary-vein-${anchor.index}`,
        points: curve,
        color,
        glowColor,
        width: 0.045 + intensity * 0.2 + anchor.point.volumeNormalized * 0.065,
        glowWidth: 0.22 + intensity * 0.52,
        opacity: 0.22 + intensity * 0.34,
        glowOpacity: 0.06 + intensity * 0.15,
        activity: intensity,
        isRisk,
        isRecovery,
        isLiquid,
      });

      const branchCount = Math.round(2 + anchor.point.volumeNormalized * 4 + anchor.point.localVolatility * 4);

      for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
        const t = (branchIndex + 1) / (branchCount + 1);
        const branchStart = curve[Math.min(curve.length - 2, Math.max(1, Math.round(t * (curve.length - 1))))];
        const branchLength = 0.18 + anchor.point.volumeNormalized * 0.34 + anchor.point.localVolatility * 0.18;
        const branchSide = branchIndex % 2 === 0 ? 1 : -1;
        const branchEnd = branchStart
          .clone()
          .add(tangent.clone().multiplyScalar(branchSide * branchLength * (0.72 + visualState.liquidity * 0.28)))
          .add(radial.clone().multiplyScalar((isRisk ? -0.08 : 0.04) + Math.sin(t * Math.PI) * 0.1))
          .add(new THREE.Vector3(0, (noise(anchor.index * 13 + branchIndex) - 0.5) * anchor.point.localVolatility * 0.16, 0));
        const branchMid = branchStart
          .clone()
          .lerp(branchEnd, 0.52)
          .add(radial.clone().multiplyScalar(Math.sin(t * Math.PI * 2) * 0.055))
          .add(new THREE.Vector3(0, anchor.point.localVolatility * 0.035 * branchSide, 0));

        veins.push({
          id: `branch-vein-${anchor.index}-${branchIndex}`,
          points: [branchStart, branchMid, branchEnd],
          color,
          glowColor,
          width: 0.018 + intensity * 0.055,
          glowWidth: 0.08 + intensity * 0.18,
          opacity: 0.095 + intensity * 0.14,
          glowOpacity: 0.026 + intensity * 0.06,
          activity: intensity * 0.7,
          isRisk,
          isRecovery,
          isLiquid,
        });
      }

      if (anchorIndex > 0 && anchorIndex % 2 === 0) {
        const previous = active[anchorIndex - 1];
        const previousPosition = orbitPoint(previous.point, points, visualState);
        const distance = anchor.position.distanceTo(previousPosition);

        if (distance < 1.45) {
          const mid = anchor.position
            .clone()
            .lerp(previousPosition, 0.5)
            .add(radial.clone().multiplyScalar(-0.08 - visualState.risk * 0.06))
            .add(new THREE.Vector3(0, Math.sin(anchor.index * 0.2) * 0.06, 0));

          crossWebs.push({
            id: `cross-web-${anchor.index}-${previous.index}`,
            points: [anchor.position, mid, previousPosition],
            color: isRisk ? visualState.colors.risk : visualState.colors.liquidity,
            opacity: 0.05 + intensity * 0.085,
            width: 0.028 + intensity * 0.06,
          });
        }
      }

      const particleCount = Math.round(26 + intensity * 72 + anchor.point.volumeNormalized * 34);

      for (let i = 0; i < particleCount; i += 1) {
        const t = i / Math.max(1, particleCount - 1);
        const curveIndex = Math.min(curve.length - 1, Math.round(t * (curve.length - 1)));
        const curvePoint = curve[curveIndex];
        const jitter = tangent
          .clone()
          .multiplyScalar((noise(anchor.index * 100 + i) - 0.5) * 0.05 * (1 - t))
          .add(radial.clone().multiplyScalar((noise(anchor.index * 80 + i) - 0.5) * 0.035));
        const finalPoint = curvePoint.clone().add(jitter);

        particles.push(finalPoint.x, finalPoint.y, finalPoint.z);

        if (i % 3 === 0) {
          pulseParticles.push(finalPoint.x, finalPoint.y, finalPoint.z);
        }
      }
    });

    return {
      veins,
      crossWebs,
      particles: new Float32Array(particles),
      pulseParticles: new Float32Array(pulseParticles),
    };
  }, [points, visualState]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (ref.current) {
      ref.current.rotation.y = Math.sin(time * 0.035) * 0.008 * visualState.liquidity;
      ref.current.rotation.x = Math.cos(time * 0.026) * 0.006 * visualState.volatility;
    }

    if (flowRef.current) {
      flowRef.current.rotation.y = time * (0.018 + visualState.liquidity * 0.026);
      flowRef.current.rotation.z = Math.sin(time * 0.11) * 0.015 * visualState.volatility;
    }
  });

  return (
    <group ref={ref}>
      {network.crossWebs.map((web) => (
        <Line
          key={web.id}
          points={web.points}
          color={web.color}
          lineWidth={web.width}
          transparent
          opacity={web.opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ))}

      {network.veins.map((vein) => (
        <group key={vein.id}>
          <Line
            points={vein.points}
            color={vein.glowColor}
            lineWidth={vein.glowWidth}
            transparent
            opacity={vein.glowOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
          <Line
            points={vein.points}
            color={vein.color}
            lineWidth={vein.width}
            transparent
            opacity={vein.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </group>
      ))}

      {network.particles.length > 0 && (
        <Points positions={network.particles} stride={3}>
          <PointMaterial
            transparent
            color={visualState.risk > 0.58 ? visualState.colors.risk : visualState.colors.recovery}
            size={0.009 + visualState.volume * 0.0065}
            sizeAttenuation
            depthWrite={false}
            opacity={0.48 + visualState.volume * 0.22 + visualState.liquidity * 0.12}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}

      {network.pulseParticles.length > 0 && (
        <group ref={flowRef}>
          <Points positions={network.pulseParticles} stride={3}>
            <PointMaterial
              transparent
              color={visualState.liquidity > 0.52 ? visualState.colors.liquiditySoft : visualState.colors.volatility}
              size={0.006 + visualState.volatility * 0.0042}
              sizeAttenuation
              depthWrite={false}
              opacity={0.38 + visualState.volatility * 0.22}
              blending={THREE.AdditiveBlending}
            />
          </Points>
        </group>
      )}
    </group>
  );
}

function CoreFlowRibbons({ visualState, points }) {
  const ref = useRef();

  const ribbons = useMemo(() => {
    return points
      .map((point, index) => ({
        point,
        index,
        activity: point.volumeNormalized * 0.74 + point.localVolatility * 0.62 + (point.direction < 0 ? visualState.risk * 0.38 : visualState.liquidity * 0.34),
      }))
      .filter((item, index) => item.activity > 0.44 || index % 16 === 0)
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 18)
      .map(({ point, index, activity }) => {
        const start = orbitPoint(point, points, visualState);
        const radial = new THREE.Vector3(start.x, 0, start.z).normalize();
        const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
        const end = radial.clone().multiplyScalar(0.48 + point.volumeNormalized * 0.08);
        end.y = start.y * 0.12;
        const isRisk = point.direction < 0;
        const color = isRisk
          ? visualState.colors.risk
          : point.volumeNormalized > 0.55
          ? visualState.colors.recovery
          : visualState.colors.liquiditySoft;
        const halo = isRisk ? visualState.colors.volatility : visualState.colors.liquidity;
        const side = index % 2 === 0 ? 1 : -1;
        const segments = 18;
        const curve = [];

        for (let i = 0; i <= segments; i += 1) {
          const t = i / segments;
          const eased = smoothstep(0, 1, t);
          const wave = Math.sin(t * Math.PI * (2.8 + point.localVolatility * 5.4) + point.index * 0.13);
          const ribbonSwing = tangent.clone().multiplyScalar(wave * (0.16 + point.localVolatility * 0.22) * (1 - t) * side);
          const pressureArc = radial.clone().multiplyScalar(Math.sin(t * Math.PI) * (0.14 + point.volumeNormalized * 0.12));
          const lift = new THREE.Vector3(0, Math.cos(t * Math.PI * 2 + point.index * 0.1) * point.localVolatility * 0.08, 0);
          curve.push(start.clone().lerp(end, eased).add(ribbonSwing).add(pressureArc).add(lift));
        }

        return {
          id: `core-ribbon-${point.index}`,
          curve,
          color,
          halo,
          activity: clamp(activity),
          volatility: point.localVolatility,
          volume: point.volumeNormalized,
        };
      });
  }, [points, visualState]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(time * 0.05) * 0.015 * visualState.liquidity;
    ref.current.rotation.z = Math.cos(time * 0.04) * 0.012 * visualState.volatility;
  });

  return (
    <group ref={ref}>
      {ribbons.map((ribbon) => (
        <group key={ribbon.id}>
          <Line
            points={ribbon.curve}
            color={ribbon.halo}
            lineWidth={0.42 + ribbon.activity * 0.52}
            transparent
            opacity={0.045 + ribbon.activity * 0.12}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
          <Line
            points={ribbon.curve}
            color={ribbon.color}
            lineWidth={0.085 + ribbon.activity * 0.18 + ribbon.volume * 0.08}
            transparent
            opacity={0.22 + ribbon.activity * 0.28}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
          <Line
            points={ribbon.curve}
            color={visualState.colors.clarity}
            lineWidth={0.018}
            transparent
            opacity={0.12 + ribbon.volatility * 0.08}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </group>
      ))}
    </group>
  );
}

function MemoryCells({ visualState, points }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const cells = useMemo(() => {
    const step = Math.max(1, Math.floor(points.length / 58));

    return points
      .filter((_, index) => index % step === 0 || index === points.length - 1)
      .map((point) => {
        const position = orbitPoint(point, points, visualState);
        const isRisk = point.direction < 0;
        const isRecovery = !isRisk && point.volumeNormalized > 0.48;
        const color = isRisk ? visualState.colors.risk : isRecovery ? visualState.colors.recovery : visualState.colors.liquidity;

        return {
          id: `cell-${point.index}`,
          point,
          position,
          color,
          isRisk,
          isRecovery,
          size: 0.018 + point.volumeNormalized * 0.024 + point.localVolatility * 0.01,
          halo: 0.04 + point.volumeNormalized * 0.07 + point.localVolatility * 0.03,
          opacity: 0.72 + point.volumeNormalized * 0.18 + point.localVolatility * 0.1,
          ringOpacity: 0.045 + point.volumeNormalized * 0.07,
        };
      });
  }, [points, visualState]);

  return (
    <group>
      {cells.map((cell) => (
        <group key={cell.id} position={cell.position}>
          <mesh>
            <sphereGeometry args={[cell.halo * 1.65, 18, 18]} />
            <meshBasicMaterial
              color={cell.isRisk ? visualState.colors.plasma : cell.isRecovery ? visualState.colors.recovery : visualState.colors.royal}
              transparent
              opacity={cell.opacity * 0.028 + cell.point.localVolatility * 0.018}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[cell.halo, 18, 18]} />
            <meshBasicMaterial
              color={cell.color}
              transparent
              opacity={cell.opacity * 0.048}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          <mesh
            rotation={[cell.point.localVolatility * 1.4, cell.point.volumeNormalized * 1.2, cell.point.localVolatility * 0.8]}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHovered(cell);
              document.body.style.cursor = "crosshair";
            }}
            onPointerOut={(event) => {
            event.stopPropagation();
              setHovered((current) => (selected?.id === cell.id ? current : null));
              document.body.style.cursor = "";
              }}
            onPointerDown={(event) => {
            event.stopPropagation();
            setSelected((current) => {
              const shouldClose = current?.id === cell.id;
             setHovered(shouldClose ? null : cell);
               return shouldClose ? null : cell;
                });
            }}
          >
            {cell.isRisk ? (
              <octahedronGeometry args={[cell.size * 1.1, 1]} />
            ) : cell.isRecovery || cell.point.localVolatility > 0.54 ? (
              <icosahedronGeometry args={[cell.size * 1.08, 2]} />
            ) : (
              <sphereGeometry args={[cell.size, 20, 20]} />
            )}
            <meshPhysicalMaterial
              color={cell.color}
              emissive={cell.color}
              emissiveIntensity={cell.isRisk ? 1.05 : cell.isRecovery ? 0.92 : 0.62}
              roughness={cell.isRisk ? 0.3 : 0.14}
              metalness={0.2}
              clearcoat={0.9}
              transparent
              opacity={Math.min(1, cell.opacity)}
            />
          </mesh>

          {(cell.point.volumeNormalized > 0.44 || cell.point.localVolatility > 0.48) && (
            <mesh rotation={[Math.PI / 2, 0.12, 0]}>
              <torusGeometry args={[cell.size * 1.85, 0.0012, 8, 52]} />
              <meshBasicMaterial
                color={cell.color}
                transparent
                opacity={cell.ringOpacity + cell.point.localVolatility * 0.045}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          )}

          {(hovered?.id === cell.id || selected?.id === cell.id) && (
            <Html center transform={false} zIndexRange={[100, 0]} style={{ pointerEvents: "none", transform: "translate3d(-50%, -118%, 0)" }}>
              <div className="w-[232px] rounded-2xl border border-white/12 bg-[#03050a]/95 px-4 py-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-3">
                  <p className="mono-font text-[0.48rem] uppercase tracking-[0.16em] text-white/38">
                    {selected?.id === cell.id ? "Selected Memory Point" : "BTC Memory Point"}
                  </p>
                  <span className="h-2 w-2 rounded-full shadow-[0_0_16px_currentColor]" style={{ backgroundColor: cell.color, color: cell.color }} />
                </div>
                <p className="mt-2 text-[0.82rem] font-medium text-white">{formatDate(cell.point.timestamp)}</p>
                <div className="mt-2 space-y-1 text-[0.68rem] leading-5 text-white/68">
                  <p>Price: <span className="text-white/88">{formatPrice(cell.point.price)}</span></p>
                  <p>
                    Signal:{" "}
                    <span style={{ color: cell.isRisk ? visualState.colors.risk : cell.isRecovery ? visualState.colors.recovery : visualState.colors.liquidity }}>
                      {cell.isRisk ? "contraction / risk" : cell.isRecovery ? "volume / recovery" : "liquidity flow"}
                    </span>
                  </p>
                  <p>Volume texture: <span className="text-white/88">{formatPercent(cell.point.volumeNormalized)}</span></p>
                  <p>Local volatility: <span className="text-white/88">{formatPercent(cell.point.localVolatility)}</span></p>
                  <p className="border-t border-white/10 pt-1.5 text-white/52">
                    Meaning: {cell.isRisk
                      ? "risk pressure compresses this point toward the nucleus"
                      : cell.isRecovery
                      ? "high volume creates warm granular memory density"
                      : "liquidity keeps this point in smooth market flow"}
                  </p>
                  <p className="pt-1 text-[0.58rem] text-white/34">
                    Tap the same point again to close this reading.
                  </p>
                </div>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

function MemoryConstellations({ visualState, points }) {
  const links = useMemo(() => {
    const selected = points
      .filter((point, index) => index % 10 === 0 || point.volumeNormalized > 0.62 || point.localVolatility > 0.58)
      .slice(-42);

    return selected.slice(1).map((point, index) => {
      const previous = selected[index];
      const start = orbitPoint(previous, points, visualState);
      const end = orbitPoint(point, points, visualState);
      const mid = start
        .clone()
        .lerp(end, 0.5)
        .multiplyScalar(0.98)
        .add(new THREE.Vector3(0, Math.sin(point.index * 0.17) * 0.08 * visualState.volatility, 0));
      const isRisk = point.direction < 0 || previous.direction < 0;
      const isVolume = point.volumeNormalized > 0.58 || previous.volumeNormalized > 0.58;

      return {
        id: `constellation-${point.index}-${previous.index}`,
        points: [start, mid, end],
        color: isRisk ? visualState.colors.plasma : isVolume ? visualState.colors.recovery : visualState.colors.royal,
        opacity: isRisk ? 0.09 + visualState.risk * 0.08 : 0.055 + visualState.liquidity * 0.055,
        width: isVolume ? 0.055 : 0.035,
      };
    });
  }, [points, visualState]);

  return (
    <group>
      {links.map((link) => (
        <Line
          key={link.id}
          points={link.points}
          color={link.color}
          lineWidth={link.width}
          transparent
          opacity={link.opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ))}
    </group>
  );

}

function StartPointMarker({ visualState, points }) {
  const ringRef = useRef();
  const glowRef = useRef();

  const marker = useMemo(() => {
    const first = points[0];
    const second = points[1] || points[0];
    if (!first) return null;

    const position = orbitPoint(first, points, visualState);
    const nextPosition = orbitPoint(second, points, visualState);
    const outward = new THREE.Vector3(position.x, 0, position.z).normalize();
    const direction = nextPosition.clone().sub(position).normalize();
    const guideMid = position.clone().lerp(nextPosition, 0.5).add(outward.clone().multiplyScalar(0.08));
    // RESTORED: previous larger, non-perspective label style
    const labelPosition = position.clone().add(outward.clone().multiplyScalar(0.28)).add(new THREE.Vector3(0, 0.18, 0));

    return {
      point: first,
      position,
      nextPosition,
      guideMid,
      labelPosition,
      direction,
      color: first.direction < 0 ? visualState.colors.plasma : visualState.colors.pearl,
      accent: first.direction < 0 ? visualState.colors.risk : visualState.colors.liquiditySoft,
    };
  }, [points, visualState]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.7;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.8) * 0.08;
    }

    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(time * 1.8) * 0.08);
    }
  });

  if (!marker) return null;

  return (
    <group position={marker.position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshBasicMaterial
          transparent
          color={marker.accent}
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.04, 24, 24]} />
        <meshPhysicalMaterial
          color={marker.color}
          emissive={marker.accent}
          emissiveIntensity={1.45}
          roughness={0.18}
          metalness={0.2}
          clearcoat={1}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.0025, 10, 96]} />
        <meshBasicMaterial
          transparent
          color={marker.accent}
          opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0.22, 0]}>
        <torusGeometry args={[0.15, 0.0014, 8, 120]} />
        <meshBasicMaterial
          transparent
          color={visualState.colors.pearl}
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Line
        points={[
          new THREE.Vector3(0, 0, 0),
          marker.guideMid.clone().sub(marker.position),
          marker.nextPosition.clone().sub(marker.position),
        ]}
        color={marker.accent}
        lineWidth={0.09}
        transparent
        opacity={0.36}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />

      <Html
        center
        transform={false}
        position={marker.labelPosition.clone().sub(marker.position)}
        zIndexRange={[80, 0]}
        style={{ pointerEvents: "none", transform: "translate3d(-50%, -50%, 0)" }}
      >
        <div className="rounded-full border border-white/12 bg-black/62 px-2.5 py-1 text-[0.48rem] font-medium uppercase tracking-[0.14em] text-white/74 shadow-[0_12px_32px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          Start · Oldest
        </div>
      </Html>
    </group>
  );
}

function CurrentPointMarker({ visualState, points }) {
  const ringRef = useRef();

  const marker = useMemo(() => {
    const latest = points[points.length - 1];
    if (!latest) return null;

    const position = orbitPoint(latest, points, visualState);
    const outward = new THREE.Vector3(position.x, 0, position.z).normalize();
    // RESTORED: previous larger, non-perspective label style
    const labelPosition = position.clone().add(outward.clone().multiplyScalar(0.32)).add(new THREE.Vector3(0, 0.18, 0));

    return {
      point: latest,
      position,
      labelPosition,
      color: latest.direction < 0 ? visualState.colors.risk : visualState.colors.emerald,
      accent: latest.direction < 0 ? visualState.colors.plasma : visualState.colors.liquiditySoft,
    };
  }, [points, visualState]);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = -state.clock.elapsedTime * 0.82;
  });

  if (!marker) return null;

  return (
    <group position={marker.position}>
      <mesh>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshBasicMaterial
          transparent
          color={marker.accent}
          opacity={0.13}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.046, 24, 24]} />
        <meshPhysicalMaterial
          color={marker.color}
          emissive={marker.accent}
          emissiveIntensity={1.35}
          roughness={0.16}
          metalness={0.16}
          clearcoat={1}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.115, 0.0022, 10, 96]} />
        <meshBasicMaterial
          transparent
          color={marker.accent}
          opacity={0.58}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Html
        center
        transform={false}
        position={marker.labelPosition.clone().sub(marker.position)}
        zIndexRange={[80, 0]}
        style={{ pointerEvents: "none", transform: "translate3d(-50%, -50%, 0)" }}
      >
        <div className="rounded-full border border-white/12 bg-black/62 px-2.5 py-1 text-[0.48rem] font-medium uppercase tracking-[0.14em] text-white/74 shadow-[0_12px_32px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          Current · Latest
        </div>
      </Html>
    </group>
  );
}

function FlowDirectionMarkers({ visualState, points }) {
  const arrows = useMemo(() => {
    if (points.length < 8) return [];

    return [0.22, 0.44, 0.66, 0.84].map((progress, index) => {
      const pointIndex = Math.min(points.length - 2, Math.max(0, Math.round(progress * (points.length - 1))));
      const point = points[pointIndex];
      const next = points[pointIndex + 1] || points[pointIndex];
      const position = orbitPoint(point, points, visualState);
      const nextPosition = orbitPoint(next, points, visualState);
      const direction = nextPosition.clone().sub(position).normalize();
      const angle = Math.atan2(direction.x, direction.z);

      return {
        id: `flow-arrow-${index}`,
        position,
        angle,
        color: point.direction < 0 ? visualState.colors.plasma : visualState.colors.liquiditySoft,
        opacity: point.direction < 0 ? 0.42 : 0.34,
      };
    });
  }, [points, visualState]);

  return (
    <group>
      {arrows.map((arrow) => (
        <group key={arrow.id} position={arrow.position} rotation={[0, arrow.angle, 0]}>
          <Line
            points={[
              new THREE.Vector3(-0.08, 0, -0.02),
              new THREE.Vector3(0.08, 0, 0),
              new THREE.Vector3(-0.08, 0, 0.02),
            ]}
            color={arrow.color}
            lineWidth={0.08}
            transparent
            opacity={arrow.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </group>
      ))}
    </group>
  );
}

function MemoryStarbursts({ visualState, points }) {
  const ref = useRef();

  const clusters = useMemo(() => {
    return points
      .map((point) => ({
        point,
        activity:
          point.volumeNormalized * 0.72 +
          point.localVolatility * 0.48 +
          (point.direction < 0 ? visualState.risk * 0.24 : visualState.liquidity * 0.28),
      }))
      .filter((item) => item.activity > 0.22)
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 68)
      .map(({ point }) => {
        const position = orbitPoint(point, points, visualState);
        const isRisk = point.direction < 0;
        const isHighVolume = point.volumeNormalized > 0.58;
        const isLiquid = !isRisk && visualState.liquidity > 0.48;
        const color = isRisk
          ? visualState.colors.risk
          : isHighVolume
          ? visualState.colors.recovery
          : isLiquid
          ? visualState.colors.liquiditySoft
          : visualState.colors.clarity;
        const secondaryColor = isRisk
          ? visualState.colors.plasma
          : isHighVolume
          ? visualState.colors.volatility
          : isLiquid
          ? visualState.colors.emerald
          : visualState.colors.royal;
        const radial = new THREE.Vector3(position.x, 0, position.z).normalize();
        const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
        const count = Math.round(18 + point.volumeNormalized * 54 + point.localVolatility * 28);
        const spread = 0.1 + point.volumeNormalized * 0.34 + point.localVolatility * 0.18;
        const particles = new Float32Array(count * 3);
        const filaments = [];
        const filamentCount = Math.round(3 + point.volumeNormalized * 5 + point.localVolatility * 5);

        for (let i = 0; i < count; i += 1) {
          const t = i / Math.max(1, count - 1);
          const spiral = t * Math.PI * (3.2 + visualState.liquidity * 1.8) + point.index * 0.37;
          const localRadius = spread * (0.12 + Math.sqrt(t) * 0.9);
          const turbulence = Math.sin(t * Math.PI * 5 + point.index * 0.21) * point.localVolatility * 0.035;
          const offset = tangent
            .clone()
            .multiplyScalar(Math.cos(spiral) * localRadius)
            .add(radial.clone().multiplyScalar(Math.sin(spiral) * localRadius * 0.62 + point.volumeNormalized * 0.055))
            .add(new THREE.Vector3(0, Math.sin(spiral * 1.6) * spread * 0.32 + turbulence, 0));

          particles[i * 3] = offset.x;
          particles[i * 3 + 1] = offset.y;
          particles[i * 3 + 2] = offset.z;
        }

        for (let filamentIndex = 0; filamentIndex < filamentCount; filamentIndex += 1) {
          const side = filamentIndex % 2 === 0 ? 1 : -1;
          const pointsOnFilament = [];
          const seed = point.index * 0.19 + filamentIndex * 0.73;
          const length = 0.24 + point.volumeNormalized * 0.28 + point.localVolatility * 0.18;

          for (let i = 0; i < 7; i += 1) {
            const t = i / 6;
            const wave = Math.sin(t * Math.PI * 2.4 + seed) * (0.025 + point.localVolatility * 0.025);
            const forward = tangent.clone().multiplyScalar((t - 0.5) * length * side);
            const outward = radial.clone().multiplyScalar((Math.sin(t * Math.PI + seed) * 0.06 + point.volumeNormalized * 0.035));
            const lift = new THREE.Vector3(0, wave + (t - 0.5) * point.localVolatility * 0.035, 0);
            pointsOnFilament.push(forward.add(outward).add(lift));
          }

          filaments.push(pointsOnFilament);
        }

        return {
          id: `stellar-${point.index}`,
          position,
          color,
          secondaryColor,
          particles,
          filaments,
          point,
          rotationSeed: noise(point.index + 91) * Math.PI * 2,
        };
      });
  }, [points, visualState]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(time * 0.04) * 0.012 * visualState.liquidity;
    ref.current.rotation.x = Math.cos(time * 0.035) * 0.008 * visualState.volatility;
  });

  return (
    <group ref={ref}>
      {clusters.map((cluster) => {
        const pulse = 0.78 + cluster.point.volumeNormalized * 0.18 + cluster.point.localVolatility * 0.16;
        const lineOpacity = 0.045 + cluster.point.volumeNormalized * 0.07 + cluster.point.localVolatility * 0.045;

        return (
          <group
            key={cluster.id}
            position={cluster.position}
            rotation={[cluster.point.localVolatility * 0.55, cluster.rotationSeed, cluster.point.volumeNormalized * 0.4]}
          >
            {cluster.filaments.map((linePoints, index) => (
              <Line
                key={`${cluster.id}-filament-${index}`}
                points={linePoints}
                color={index % 2 === 0 ? cluster.color : cluster.secondaryColor}
                lineWidth={0.055 + cluster.point.volumeNormalized * 0.04}
                transparent
                opacity={lineOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            ))}

            <Points positions={cluster.particles} stride={3}>
              <PointMaterial
                transparent
                color={cluster.color}
                size={0.0105 + cluster.point.volumeNormalized * 0.0072 + cluster.point.localVolatility * 0.004}
                sizeAttenuation
                depthWrite={false}
                opacity={Math.min(1, pulse + 0.16)}
                blending={THREE.AdditiveBlending}
              />
            </Points>

            <Points positions={cluster.particles} stride={3}>
              <PointMaterial
                transparent
                color={cluster.secondaryColor}
                size={0.0048 + cluster.point.localVolatility * 0.0035}
                sizeAttenuation
                depthWrite={false}
                opacity={0.34 + cluster.point.localVolatility * 0.24}
                blending={THREE.AdditiveBlending}
              />
            </Points>
          </group>
        );
      })}
    </group>
  );
}

function Organism({ visualState, points }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.rotation.y = time * 0.0032;
    ref.current.rotation.x = Math.sin(time * 0.055) * 0.014 * visualState.volatility;
    ref.current.rotation.z = Math.cos(time * 0.05) * 0.01 * visualState.risk;
  });

  return (
    <group ref={ref}>
      <ChromaticMemoryDust visualState={visualState} points={points} />
      <MemoryOrbit visualState={visualState} points={points} />
      <DensityNebula visualState={visualState} points={points} />
      <MemoryConstellations visualState={visualState} points={points} />
      <WarmDataFabric visualState={visualState} points={points} />
      <VascularNetwork visualState={visualState} points={points} />
      <CoreFlowRibbons visualState={visualState} points={points} />
      <MemoryStarbursts visualState={visualState} points={points} />
      <MemoryCells visualState={visualState} points={points} />
      <FlowDirectionMarkers visualState={visualState} points={points} />
      <StartPointMarker visualState={visualState} points={points} />
      <CurrentPointMarker visualState={visualState} points={points} />
    </group>
  );
}


function VisualGuide({ visualState }) {
  const layers = [
    ["Core Nucleus", "live BTC state, current pressure and market pulse", visualState.core.innerColor],
    ["Memory Orbit", "historical BTC prices curved into a temporal memory path", visualState.colors.liquiditySoft],
    ["Memory Cells", "individual market moments carrying price, volume and volatility", visualState.colors.recovery],
    ["Warm Data Fabric", "granular amber texture generated by volume and market activity", visualState.colors.volatility],
    ["Vascular Network", "active points form data veins flowing toward the BTC nucleus", visualState.colors.risk],
    ["Density Nebula", "transaction intensity and liquidity become spatial atmosphere", visualState.colors.liquidity],
  ];

  return (
    <div className="pointer-events-none absolute left-5 top-5 z-20 hidden w-[230px] rounded-3xl border border-white/10 bg-black/30 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl 2xl:block">
      <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-white/38">Visual grammar</p>
      <div className="mt-4 space-y-3">
        {layers.map(([label, signal, color]) => (
          <div key={label} className="flex gap-3">
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full shadow-[0_0_16px_currentColor]"
              style={{ backgroundColor: color, color }}
            />
            <div>
              <p className="text-[0.7rem] font-medium leading-4 text-white/82">{label}</p>
              <p className="text-[0.56rem] leading-4 text-white/42">{signal}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricOverlay({ visualState, points }) {
  const [isOpen, setIsOpen] = useState(false);
  const latest = points[points.length - 1] || {};
  const metrics = [
    ["Liquidity", visualState.liquidity],
    ["Volume", visualState.volume],
    ["Volatility", visualState.volatility],
    ["Risk", visualState.risk],
  ];

  return (
    <div className="absolute left-5 top-5 z-30 hidden xl:block">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? "Close live reading" : "Open live reading"}
        className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border text-[1.05rem] leading-none backdrop-blur-xl transition duration-300 ${
          isOpen
            ? "border-white/24 bg-white text-black shadow-[0_0_34px_rgba(255,255,255,0.14)]"
            : "border-white/12 bg-black/42 text-white/70 hover:border-white/26 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        {isOpen ? "×" : "•••"}
      </button>

      {isOpen && (
        <div className="pointer-events-none mt-3 w-[190px] rounded-[1.25rem] border border-white/10 bg-black/46 p-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <p className="mono-font text-[0.42rem] uppercase tracking-[0.16em] text-white/34">Live reading</p>
          <p className="mt-1.5 text-sm font-medium tracking-[-0.02em] text-white/86">{visualState.mood.label}</p>
          <p className="mt-1 text-[0.56rem] leading-4 text-white/42">{formatPrice(latest.price)} · {points.length} points</p>
          <div className="mt-2.5 space-y-1.5">
            {metrics.map(([label, value]) => {
              const percent = Math.round(clamp(value) * 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-[0.54rem] text-white/52">
                    <span>{label}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-white/62" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2.5 line-clamp-3 text-[0.54rem] leading-4 text-white/36">{visualState.summary}</p>
        </div>
      )}
    </div>
  );
}

export default function BTCOrganismV2({ pulse, history }) {
  const points = useMemo(() => normalizeHistory(history), [history]);
  const visualState = useMemo(
    () => enrichVisualState(buildBTCVisualState({ pulse, history }), points),
    [pulse, history, points]
  );

  return (
    <div className="relative h-full w-full touch-manipulation overflow-hidden rounded-[32px] bg-[#02040a]"> 
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,4,10,0.04)_40%,rgba(2,4,10,0.92)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_48%,rgba(111,234,255,0.14),transparent_24%),radial-gradient(circle_at_43%_55%,rgba(255,199,106,0.11),transparent_23%),radial-gradient(circle_at_66%_43%,rgba(255,106,213,0.105),transparent_27%),radial-gradient(circle_at_37%_39%,rgba(103,167,255,0.08),transparent_24%)]" />

      <VisualGuide visualState={visualState} />
      <MetricOverlay visualState={visualState} points={points} />

      <Canvas
        dpr={[1, 1.45]}
        camera={{ position: [0, 0.16, 6.15], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[PALETTE.space]} />
        <ambientLight intensity={0.18} />
        <pointLight position={[0, 1.2, 2.4]} intensity={1.9} color={visualState.core.innerColor} />
        <pointLight position={[-2.8, -0.8, -1.5]} intensity={0.9} color={visualState.colors.liquidity} />
        <pointLight position={[2.6, 0.9, -1.8]} intensity={0.75} color={visualState.colors.volatility} />

        <group position={[-0.08, 0.06, 0]} scale={1.34}>
          <Atmosphere visualState={visualState} />
          <CoordinateField visualState={visualState} />
          <Organism visualState={visualState} points={points} />
          <Core visualState={visualState} />
        </group>

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.48}
          zoomSpeed={0.62}
          panSpeed={0.38}
          minDistance={2.45}
          maxDistance={8.2}
          maxPolarAngle={Math.PI * 0.92}
          minPolarAngle={Math.PI * 0.08}
        />
      </Canvas>
    </div>
  );
}