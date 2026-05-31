import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function smoothValue(points, index, key, radius = 2) {
  let sum = 0;
  let weightSum = 0;

  for (let offset = -radius; offset <= radius; offset += 1) {
    const sample = points[index + offset];
    if (!sample) continue;

    const weight = radius + 1 - Math.abs(offset);
    sum += safeNumber(sample[key], 0.5) * weight;
    weightSum += weight;
  }

  return weightSum ? sum / weightSum : safeNumber(points[index]?.[key], 0.5);
}

function getWarmFabricAnchor(point, index, points, visualState) {
  const progress = safeNumber(point.progress, index / Math.max(1, points.length - 1));
  const angle = progress * Math.PI * 2;
  const price = smoothValue(points, index, "priceNormalized", 3);
  const volume = smoothValue(points, index, "volumeNormalized", 2);
  const volatility = smoothValue(points, index, "localVolatility", 2);
  const direction = safeNumber(point.direction, 0);

  const radius =
    2.16 +
    (price - 0.5) * 0.62 +
    volume * 0.18 +
    Math.sin(progress * Math.PI * 9) * volatility * 0.075 +
    (direction < 0 ? -visualState.risk * 0.035 : visualState.liquidity * 0.028);

  const y =
    (price - 0.5) * 0.54 +
    Math.sin(progress * Math.PI * 3.6) * visualState.liquidity * 0.06 +
    Math.cos(progress * Math.PI * 7.8) * volatility * 0.08;

  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

export default function BTCWarmDataFabric({ visualState, history }) {
  const fabricRef = useRef();
  const amberRef = useRef();
  const roseRef = useRef();
  const goldRef = useRef();

  const fabric = useMemo(() => {
    const historyPoints = Array.isArray(history?.points) ? history.points : [];

    if (historyPoints.length < 8) {
      return {
        amberField: new Float32Array(0),
        roseField: new Float32Array(0),
        goldField: new Float32Array(0),
      };
    }

    const amberTriplets = [];
    const roseTriplets = [];
    const goldTriplets = [];

    historyPoints.forEach((point, index) => {
      const volume = safeNumber(point.volumeNormalized, 0.35);
      const volatility = safeNumber(point.localVolatility, 0.25);
      const price = safeNumber(point.priceNormalized, 0.5);
      const isRisk = safeNumber(point.direction, 0) < 0;
      const activity = volume * 0.62 + volatility * 0.52 + (isRisk ? visualState.risk * 0.38 : visualState.liquidity * 0.24);

      if (activity < 0.18 && index % 5 !== 0) return;

      const anchor = getWarmFabricAnchor(point, index, historyPoints, visualState);
      const radial = new THREE.Vector3(anchor.x, 0, anchor.z).normalize();
      const tangent = new THREE.Vector3(-radial.z, 0, radial.x).normalize();
      const up = new THREE.Vector3(0, 1, 0);

      const pointCount = Math.round(16 + volume * 70 + volatility * 48);
      const fabricLength = 0.16 + volume * 0.52 + visualState.liquidity * 0.18;
      const fabricWidth = 0.055 + volume * 0.2 + volatility * 0.18;
      const inwardPull = -0.08 - visualState.risk * 0.09 + (price - 0.5) * 0.035;

      for (let i = 0; i < pointCount; i += 1) {
        const t = i / Math.max(1, pointCount - 1);
        const wave = Math.sin(t * Math.PI * 9.5 + index * 0.21);
        const ridge = Math.cos(t * Math.PI * 5.4 - index * 0.17);
        const grain = Math.sin((index + 1) * (i + 3) * 12.9898) * 43758.5453;
        const random01 = grain - Math.floor(grain);

        const local = anchor
          .clone()
          .add(tangent.clone().multiplyScalar((t - 0.5) * fabricLength + wave * fabricWidth * 0.42))
          .add(radial.clone().multiplyScalar(inwardPull + ridge * fabricWidth * 0.72))
          .add(up.clone().multiplyScalar(wave * fabricWidth * 0.38 + (random01 - 0.5) * volatility * 0.16));

        amberTriplets.push(local.x, local.y, local.z);

        if (isRisk && i % 2 === 0) {
          roseTriplets.push(local.x, local.y, local.z);
        }

        if (!isRisk && volume > 0.46 && i % 3 === 0) {
          goldTriplets.push(local.x, local.y, local.z);
        }
      }
    });

    return {
      amberField: new Float32Array(amberTriplets),
      roseField: new Float32Array(roseTriplets),
      goldField: new Float32Array(goldTriplets),
    };
  }, [history, visualState]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (fabricRef.current) {
      fabricRef.current.rotation.y = Math.sin(time * 0.03) * 0.007 * visualState.liquidity;
      fabricRef.current.rotation.x = Math.cos(time * 0.026) * 0.007 * visualState.volatility;
      fabricRef.current.rotation.z = Math.sin(time * 0.022) * 0.005 * visualState.risk;
    }

    if (amberRef.current) {
      amberRef.current.rotation.y = -time * (0.001 + visualState.volume * 0.002);
    }

    if (roseRef.current) {
      roseRef.current.rotation.y = time * (0.0012 + visualState.risk * 0.002);
    }

    if (goldRef.current) {
      goldRef.current.rotation.z = Math.sin(time * 0.035) * 0.006;
    }
  });

  if (!fabric.amberField.length) return null;

  return (
    <group ref={fabricRef}>
      <Points ref={amberRef} positions={fabric.amberField} stride={3}>
        <PointMaterial
          transparent
          color="#FF8A2A"
          size={0.0064 + visualState.volume * 0.0042}
          sizeAttenuation
          depthWrite={false}
          opacity={0.46 + visualState.volume * 0.2 + visualState.volatility * 0.12}
          blending={THREE.AdditiveBlending}
        />
      </Points>

      {fabric.roseField.length > 0 && (
        <Points ref={roseRef} positions={fabric.roseField} stride={3}>
          <PointMaterial
            transparent
            color="#FF3D6E"
            size={0.0068 + visualState.volatility * 0.0048}
            sizeAttenuation
            depthWrite={false}
            opacity={0.34 + visualState.risk * 0.26}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}

      {fabric.goldField.length > 0 && (
        <Points ref={goldRef} positions={fabric.goldField} stride={3}>
          <PointMaterial
            transparent
            color="#FFD36A"
            size={0.0072 + visualState.volume * 0.0048}
            sizeAttenuation
            depthWrite={false}
            opacity={0.42 + visualState.volume * 0.24}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}
    </group>
  );
}
