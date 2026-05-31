import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function clamp01(value, fallback = 0.5) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value > 1 ? value / 100 : value));
}

function getSignals(entity = {}, pulse = {}) {
  const risk = clamp01(entity.risk ?? pulse.risk, 0.18);
  const liquidity = clamp01(entity.liquidity ?? pulse.liquidity, 0.82);
  const volume = clamp01(entity.volume ?? pulse.volume, 0.78);
  const volatility = clamp01(entity.volatility ?? pulse.volatility, 0.28);
  const health = clamp01(entity.health ?? pulse.health, 0.91);

  return {
    risk,
    liquidity,
    volume,
    volatility,
    health,
  };
}

function getFieldColor({ risk, liquidity, health }) {
  if (risk > 0.62) return "#ff8a7a";
  if (liquidity > 0.72 && health > 0.76) return "#f4f1ea";
  if (liquidity > 0.62) return "#8ba3ff";
  return "#ffcc82";
}

function MemoryBloom({ entity, pulse }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const signals = getSignals(entity, pulse);
    const { volume, liquidity, risk } = signals;

    const count = Math.round(2200 + volume * 2600);
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = Math.random() * Math.PI * 2;
      const spiral = angle + t * Math.PI * 6;

      const radius =
        Math.pow(Math.random(), 0.55) *
        (2.4 + volume * 1.7 + liquidity * 0.5);

      const verticalBloom =
        Math.sin(t * Math.PI * 8) * 0.35 * liquidity +
        (Math.random() - 0.5) * (1.15 + risk * 0.55);

      array[i * 3] = Math.cos(spiral) * radius;
      array[i * 3 + 1] = verticalBloom;
      array[i * 3 + 2] = Math.sin(spiral) * radius;
    }

    return array;
  }, [entity, pulse]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { liquidity, volatility, risk } = getSignals(entity, pulse);

    if (!ref.current) return;

    ref.current.rotation.y = time * (0.012 + liquidity * 0.035);
    ref.current.rotation.x = Math.sin(time * 0.14) * 0.08 * volatility;
    ref.current.rotation.z = Math.cos(time * 0.1) * 0.035 * risk;

    ref.current.scale.setScalar(
      1 + Math.sin(time * 0.45) * 0.035 * liquidity
    );
  });

  const signals = getSignals(entity, pulse);

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={getFieldColor(signals)}
        size={0.012 + signals.volume * 0.01}
        sizeAttenuation
        depthWrite={false}
        opacity={0.35 + signals.health * 0.2}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function LiquidityVeins({ entity, pulse }) {
  const groupRef = useRef();

  const curves = useMemo(() => {
    const { liquidity, volume, risk } = getSignals(entity, pulse);
    const allCurves = [];
    const curveCount = 9;

    for (let c = 0; c < curveCount; c++) {
      const points = [];
      const phase = (c / curveCount) * Math.PI * 2;

      for (let i = 0; i < 90; i++) {
        const t = i / 89;
        const angle = t * Math.PI * 2 + phase;

        const radius =
          1.2 +
          Math.sin(t * Math.PI * 3 + phase) * 0.55 * liquidity +
          volume * 0.9;

        const y =
          Math.sin(t * Math.PI * 2 + phase) * 0.42 * liquidity +
          Math.sin(t * Math.PI * 11) * 0.08 * risk;

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius
          )
        );
      }

      allCurves.push(points);
    }

    return allCurves;
  }, [entity, pulse]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { liquidity } = getSignals(entity, pulse);

    if (!groupRef.current) return;

    groupRef.current.rotation.y = -time * (0.018 + liquidity * 0.024);
  });

  const signals = getSignals(entity, pulse);

  return (
    <group ref={groupRef}>
      {curves.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={signals.risk > 0.58 ? "#ff8a7a" : "#8ba3ff"}
          lineWidth={0.45}
          transparent
          opacity={0.13 + signals.liquidity * 0.16}
        />
      ))}
    </group>
  );
}

function MemoryCore({ entity, pulse }) {
  const coreRef = useRef();
  const shellRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { risk, liquidity, health } = getSignals(entity, pulse);

    if (coreRef.current) {
      coreRef.current.rotation.y = time * (0.028 + liquidity * 0.035);
      coreRef.current.rotation.x = Math.sin(time * 0.22) * 0.08 * risk;
      coreRef.current.scale.setScalar(
        1 + Math.sin(time * 0.6) * 0.025 * health
      );
    }

    if (shellRef.current) {
      shellRef.current.rotation.y = -time * 0.012;
      shellRef.current.rotation.z = Math.sin(time * 0.14) * 0.035;
    }
  });

  const signals = getSignals(entity, pulse);

  return (
    <group>
      <mesh ref={shellRef}>
        <sphereGeometry args={[2.25 + signals.volume * 0.55, 48, 48]} />
        <meshBasicMaterial
          wireframe
          transparent
          color={signals.risk > 0.6 ? "#ff8a7a" : "#8ba3ff"}
          opacity={0.025 + signals.health * 0.035}
        />
      </mesh>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.9 + signals.volume * 0.28, 4]} />
        <meshBasicMaterial
          wireframe
          transparent
          color="#f4f1ea"
          opacity={0.045 + signals.health * 0.055}
        />
      </mesh>
    </group>
  );
}

function PressureDust({ entity, pulse }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const count = 1600;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 13;
      array[i * 3 + 1] = (Math.random() - 0.5) * 7;
      array[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    return array;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { volatility } = getSignals(entity, pulse);

    if (!ref.current) return;

    ref.current.rotation.y = time * 0.003;
    ref.current.rotation.x = Math.sin(time * 0.08) * 0.02 * volatility;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#f4f1ea"
        size={0.007}
        sizeAttenuation
        depthWrite={false}
        opacity={0.09}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function RiskFracture({ entity, pulse }) {
  const ref = useRef();

  const points = useMemo(() => {
    const { risk } = getSignals(entity, pulse);
    const fracturePoints = [];

    for (let i = 0; i < 70; i++) {
      const t = i / 69;
      const angle = t * Math.PI * 2;

      const radius =
        2.8 +
        Math.sin(t * Math.PI * 9) * 0.18 * risk +
        Math.sin(t * Math.PI * 21) * 0.08 * risk;

      fracturePoints.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(t * Math.PI * 5) * 0.2 * risk,
          Math.sin(angle) * radius
        )
      );
    }

    fracturePoints.push(fracturePoints[0].clone());

    return fracturePoints;
  }, [entity, pulse]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { risk } = getSignals(entity, pulse);

    if (!ref.current) return;

    ref.current.rotation.y = time * (0.01 + risk * 0.03);
    ref.current.rotation.z = Math.sin(time * 0.23) * 0.05 * risk;
  });

  const { risk } = getSignals(entity, pulse);

  if (risk < 0.22) return null;

  return (
    <group ref={ref}>
      <Line
        points={points}
        color="#ff6a6a"
        lineWidth={0.55}
        transparent
        opacity={0.08 + risk * 0.22}
      />
    </group>
  );
}

function AtmosphereGlow({ entity, pulse }) {
  const signals = getSignals(entity, pulse);

  return (
    <mesh>
      <sphereGeometry args={[3.9, 48, 48]} />
      <meshBasicMaterial
        transparent
        color={signals.risk > 0.58 ? "#ff6a6a" : "#8ba3ff"}
        opacity={0.028 + signals.health * 0.035}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function FeaturedMemoryField({ entity, pulse }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#030406]">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.035)_44%,rgba(3,4,6,0.84)_100%)]" />

      <Canvas
        dpr={[1, 1.25]}
        camera={{
          position: [0, 0.25, 6.5],
          fov: 45,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#030406"]} />
        <fog attach="fog" args={["#030406", 5.2, 13]} />

        <ambientLight intensity={0.36} />
        <pointLight position={[3.5, 2.4, 4]} intensity={0.82} color="#8ba3ff" />
        <pointLight position={[-3.2, -2, 4]} intensity={0.38} color="#ffcc82" />

        <group position={[0, -0.25, 0]} scale={1.48}>
          <PressureDust entity={entity} pulse={pulse} />
          <AtmosphereGlow entity={entity} pulse={pulse} />
          <LiquidityVeins entity={entity} pulse={pulse} />
          <RiskFracture entity={entity} pulse={pulse} />
          <MemoryBloom entity={entity} pulse={pulse} />
          <MemoryCore entity={entity} pulse={pulse} />
        </group>
      </Canvas>
    </div>
  );
}
