import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function clamp01(value, fallback = 0.5) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value > 1 ? value / 100 : value));
}

function getSignals(entity = {}) {
  return {
    volatility: clamp01(entity.volatility, 0.5),
    liquidity: clamp01(entity.liquidity, 0.5),
    risk: clamp01(entity.risk, 0.3),
    density: clamp01(entity.density ?? entity.volume, 0.6),
    health: clamp01(entity.health, 0.75),
  };
}

function getSimulatorColor(signals) {
  if (signals.risk > 0.68) return "#ff6a6a";
  if (signals.volatility > 0.72) return "#ffb08a";
  if (signals.liquidity > 0.7) return "#8ba3ff";
  if (signals.density > 0.72) return "#f4f1ea";
  return "#dfe7ff";
}

function SignalCore({ entity }) {
  const coreRef = useRef();
  const shellRef = useRef();

  const signals = getSignals(entity);
  const color = getSimulatorColor(signals);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.rotation.y = time * (0.035 + signals.volatility * 0.09);
      coreRef.current.rotation.x = Math.sin(time * 0.24) * 0.16 * signals.risk;
      coreRef.current.scale.setScalar(
        1 +
          Math.sin(time * 0.7) * 0.035 * signals.liquidity +
          signals.risk * 0.05
      );
    }

    if (shellRef.current) {
      shellRef.current.rotation.y = -time * (0.01 + signals.liquidity * 0.025);
      shellRef.current.rotation.z = Math.sin(time * 0.18) * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={shellRef}>
        <sphereGeometry args={[2.35 + signals.density * 0.6, 56, 56]} />
        <meshBasicMaterial
          wireframe
          transparent
          color={color}
          opacity={0.025 + signals.health * 0.04}
        />
      </mesh>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1 + signals.density * 0.25, 5]} />
        <meshBasicMaterial
          wireframe
          transparent
          color="#f4f1ea"
          opacity={0.05 + signals.health * 0.055}
        />
      </mesh>
    </group>
  );
}

function DensityCloud({ entity }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const signals = getSignals(entity);
    const count = Math.round(1600 + signals.density * 3600);
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = Math.random() * Math.PI * 2;

      const radius =
        Math.pow(Math.random(), 0.58) *
        (2.1 + signals.density * 2.1 + signals.liquidity * 0.45);

      const turbulence =
        Math.sin(t * Math.PI * 23) * signals.volatility * 0.32 +
        Math.sin(t * Math.PI * 47) * signals.risk * 0.2;

      array[i * 3] = Math.cos(angle) * (radius + turbulence);
      array[i * 3 + 1] =
        (Math.random() - 0.5) * (1.4 + signals.volatility * 2.2);
      array[i * 3 + 2] = Math.sin(angle) * (radius + turbulence);
    }

    return array;
  }, [entity]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const signals = getSignals(entity);

    if (!ref.current) return;

    ref.current.rotation.y = time * (0.012 + signals.liquidity * 0.045);
    ref.current.rotation.x = Math.sin(time * 0.17) * 0.12 * signals.volatility;
    ref.current.rotation.z = Math.cos(time * 0.13) * 0.08 * signals.risk;
  });

  const signals = getSignals(entity);

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={getSimulatorColor(signals)}
        size={0.01 + signals.density * 0.014}
        sizeAttenuation
        depthWrite={false}
        opacity={0.26 + signals.density * 0.24}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function LiquidityFlow({ entity }) {
  const groupRef = useRef();

  const curves = useMemo(() => {
    const signals = getSignals(entity);
    const result = [];
    const curveCount = 8;

    for (let c = 0; c < curveCount; c++) {
      const points = [];
      const phase = (c / curveCount) * Math.PI * 2;

      for (let i = 0; i < 100; i++) {
        const t = i / 99;
        const angle = t * Math.PI * 2 + phase;

        const smoothRadius =
          1.45 +
          signals.liquidity * 1.15 +
          Math.sin(t * Math.PI * 4 + phase) * 0.38 * signals.liquidity;

        const instability =
          Math.sin(t * Math.PI * 17 + phase) * 0.12 * signals.volatility +
          Math.sin(t * Math.PI * 31) * 0.08 * signals.risk;

        const radius = smoothRadius + instability;

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(t * Math.PI * 2 + phase) * 0.45 * signals.liquidity,
            Math.sin(angle) * radius
          )
        );
      }

      result.push(points);
    }

    return result;
  }, [entity]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const signals = getSignals(entity);

    if (!groupRef.current) return;

    groupRef.current.rotation.y = -time * (0.018 + signals.liquidity * 0.035);
    groupRef.current.rotation.x = Math.sin(time * 0.12) * 0.04;
  });

  const signals = getSignals(entity);
  const color = signals.risk > 0.62 ? "#ff8a7a" : "#8ba3ff";

  return (
    <group ref={groupRef}>
      {curves.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={color}
          lineWidth={0.5}
          transparent
          opacity={0.08 + signals.liquidity * 0.18}
        />
      ))}
    </group>
  );
}

function RiskDistortion({ entity }) {
  const ref = useRef();
  const signals = getSignals(entity);

  const fractures = useMemo(() => {
    const result = [];
    const fractureCount = Math.round(2 + signals.risk * 7);

    for (let f = 0; f < fractureCount; f++) {
      const points = [];
      const phase = Math.random() * Math.PI * 2;

      for (let i = 0; i < 42; i++) {
        const t = i / 41;
        const angle = phase + t * Math.PI * 1.35;

        const radius =
          1.3 +
          t * (1.3 + signals.risk * 1.1) +
          Math.sin(t * Math.PI * 12) * 0.16 * signals.risk;

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 0.85 * signals.risk,
            Math.sin(angle) * radius
          )
        );
      }

      result.push(points);
    }

    return result;
  }, [entity]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!ref.current) return;

    ref.current.rotation.y = time * (0.01 + signals.risk * 0.03);
    ref.current.rotation.z = Math.sin(time * 0.23) * 0.08 * signals.risk;
  });

  if (signals.risk < 0.16) return null;

  return (
    <group ref={ref}>
      {fractures.map((points, index) => (
        <Line
          key={index}
          points={points}
          color="#ff6a6a"
          lineWidth={0.65}
          transparent
          opacity={0.06 + signals.risk * 0.26}
        />
      ))}
    </group>
  );
}

function SignalDust() {
  const ref = useRef();

  const positions = useMemo(() => {
    const count = 1500;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 12.5;
      array[i * 3 + 1] = (Math.random() - 0.5) * 6.8;
      array[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    return array;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!ref.current) return;

    ref.current.rotation.y = time * 0.004;
    ref.current.rotation.x = Math.sin(time * 0.06) * 0.014;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#f4f1ea"
        size={0.007}
        sizeAttenuation
        depthWrite={false}
        opacity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function SignalGlow({ entity }) {
  const signals = getSignals(entity);
  const color = getSimulatorColor(signals);

  return (
    <mesh>
      <sphereGeometry args={[3.85, 48, 48]} />
      <meshBasicMaterial
        transparent
        color={color}
        opacity={0.025 + signals.health * 0.035}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function SignalSimulator({ entity }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#030406]">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.035)_44%,rgba(3,4,6,0.84)_100%)]" />

      <Canvas
        dpr={[1, 1.25]}
        camera={{
          position: [0, 0.25, 6.15],
          fov: 46,
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

        <group position={[0, -0.45, 0]} scale={1.58}>
          <SignalDust />
          <SignalGlow entity={entity} />
          <LiquidityFlow entity={entity} />
          <RiskDistortion entity={entity} />
          <DensityCloud entity={entity} />
          <SignalCore entity={entity} />
        </group>
      </Canvas>
    </div>
  );
}