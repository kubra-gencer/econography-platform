

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function clamp01(value, fallback = 0.5) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value > 1 ? value / 100 : value));
}

function getSignals(entity = {}, company = {}) {
  return {
    health: clamp01(entity.health ?? company.paymentHealth, 0.72),
    risk: clamp01(entity.risk ?? company.riskPressure, 0.3),
    liquidity: clamp01(entity.liquidity ?? company.liquidityCoherence, 0.62),
    density: clamp01(entity.volume ?? company.transactionDensity, 0.65),
    volatility: clamp01(entity.volatility ?? company.riskPressure, 0.36),
    score: clamp01(company.visualScore, 0.82),
  };
}

function getAuraPalette(signals, company = {}) {
  const category = (company.category || "").toLowerCase();

  if (signals.risk > 0.58) {
    return {
      primary: "#ff8a7a",
      secondary: "#ff6a6a",
      accent: "#f4f1ea",
    };
  }

  if (category.includes("bank")) {
    return {
      primary: "#dfe7ff",
      secondary: "#8ba3ff",
      accent: "#f4f1ea",
    };
  }

  if (category.includes("commerce")) {
    return {
      primary: "#ffcc82",
      secondary: "#f4f1ea",
      accent: "#8ba3ff",
    };
  }

  if (signals.liquidity > 0.72) {
    return {
      primary: "#f4f1ea",
      secondary: "#8ba3ff",
      accent: "#ffcc82",
    };
  }

  return {
    primary: "#f4f1ea",
    secondary: "#8ba3ff",
    accent: "#ffcc82",
  };
}

function AuraCore({ entity, company }) {
  const coreRef = useRef();
  const shellRef = useRef();

  const signals = getSignals(entity, company);
  const palette = getAuraPalette(signals, company);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.rotation.y = time * (0.028 + signals.liquidity * 0.045);
      coreRef.current.rotation.x = Math.sin(time * 0.2) * 0.1 * signals.risk;
      coreRef.current.scale.setScalar(
        1 + Math.sin(time * 0.58) * 0.025 * signals.health
      );
    }

    if (shellRef.current) {
      shellRef.current.rotation.y = -time * 0.014;
      shellRef.current.rotation.z = Math.sin(time * 0.16) * 0.04;
    }
  });

  return (
    <group>
      <mesh ref={shellRef}>
        <sphereGeometry args={[2.25 + signals.density * 0.55, 56, 56]} />
        <meshBasicMaterial
          wireframe
          transparent
          color={palette.secondary}
          opacity={0.025 + signals.health * 0.035}
        />
      </mesh>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.9 + signals.score * 0.35, 5]} />
        <meshBasicMaterial
          wireframe
          transparent
          color={palette.primary}
          opacity={0.045 + signals.score * 0.05}
        />
      </mesh>
    </group>
  );
}

function AuraParticles({ entity, company }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const signals = getSignals(entity, company);
    const count = Math.round(1800 + signals.density * 2600);
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = Math.random() * Math.PI * 2;

      const categoryBias =
        company?.id === "chainnova"
          ? Math.sin(t * Math.PI * 31) * signals.risk * 0.42
          : company?.id === "velox-market"
          ? Math.sin(t * Math.PI * 15) * signals.density * 0.32
          : Math.sin(t * Math.PI * 7) * signals.liquidity * 0.22;

      const radius =
        Math.pow(Math.random(), 0.62) *
          (2.2 + signals.density * 1.75 + signals.liquidity * 0.45) +
        categoryBias;

      const vertical =
        (Math.random() - 0.5) * (1.35 + signals.volatility * 1.4) +
        Math.sin(t * Math.PI * 8) * 0.32 * signals.liquidity;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = vertical;
      array[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return array;
  }, [entity, company]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const signals = getSignals(entity, company);

    if (!ref.current) return;

    ref.current.rotation.y = time * (0.01 + signals.liquidity * 0.034);
    ref.current.rotation.x = Math.sin(time * 0.13) * 0.075 * signals.volatility;
    ref.current.rotation.z = Math.cos(time * 0.11) * 0.035 * signals.risk;
  });

  const signals = getSignals(entity, company);
  const palette = getAuraPalette(signals, company);

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={palette.primary}
        size={0.011 + signals.density * 0.011}
        sizeAttenuation
        depthWrite={false}
        opacity={0.28 + signals.health * 0.24}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function AuraRings({ entity, company }) {
  const groupRef = useRef();

  const rings = useMemo(() => {
    const signals = getSignals(entity, company);
    const result = [];
    const ringCount = 5;

    for (let r = 0; r < ringCount; r++) {
      const points = [];
      const offset = (r / ringCount) * Math.PI * 2;

      for (let i = 0; i < 120; i++) {
        const t = i / 119;
        const angle = t * Math.PI * 2;

        const distortion =
          Math.sin(t * Math.PI * 9 + offset) * 0.06 * signals.risk +
          Math.sin(t * Math.PI * 17 + offset) * 0.03 * signals.volatility;

        const radius =
          1.35 +
          r * 0.34 +
          signals.liquidity * 0.28 +
          signals.density * 0.16 +
          distortion;

        const y =
          Math.sin(t * Math.PI * 2 + offset) *
          (0.16 + signals.liquidity * 0.22);

        points.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            y + (r - 2) * 0.12,
            Math.sin(angle) * radius
          )
        );
      }

      points.push(points[0].clone());
      result.push(points);
    }

    return result;
  }, [entity, company]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const signals = getSignals(entity, company);

    if (!groupRef.current) return;

    groupRef.current.rotation.y = -time * (0.012 + signals.liquidity * 0.025);
    groupRef.current.rotation.x = Math.sin(time * 0.17) * 0.04 * signals.risk;
  });

  const signals = getSignals(entity, company);
  const palette = getAuraPalette(signals, company);

  return (
    <group ref={groupRef}>
      {rings.map((points, index) => (
        <Line
          key={index}
          points={points}
          color={index % 2 === 0 ? palette.secondary : palette.accent}
          lineWidth={0.42}
          transparent
          opacity={0.08 + signals.liquidity * 0.11}
        />
      ))}
    </group>
  );
}

function FractureSignature({ entity, company }) {
  const ref = useRef();
  const signals = getSignals(entity, company);

  const points = useMemo(() => {
    const fracture = [];

    for (let i = 0; i < 80; i++) {
      const t = i / 79;
      const angle = t * Math.PI * 2;

      const radius =
        2.1 +
        Math.sin(t * Math.PI * 13) * 0.14 * signals.risk +
        Math.sin(t * Math.PI * 29) * 0.08 * signals.volatility;

      fracture.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(t * Math.PI * 7) * 0.22 * signals.risk,
          Math.sin(angle) * radius
        )
      );
    }

    fracture.push(fracture[0].clone());

    return fracture;
  }, [signals.risk, signals.volatility]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!ref.current) return;

    ref.current.rotation.y = time * (0.012 + signals.risk * 0.028);
    ref.current.rotation.z = Math.sin(time * 0.22) * 0.05 * signals.risk;
  });

  if (signals.risk < 0.24) return null;

  return (
    <group ref={ref}>
      <Line
        points={points}
        color="#ff6a6a"
        lineWidth={0.6}
        transparent
        opacity={0.06 + signals.risk * 0.25}
      />
    </group>
  );
}

function AuraDust() {
  const ref = useRef();

  const positions = useMemo(() => {
    const count = 1500;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 12;
      array[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      array[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    return array;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!ref.current) return;

    ref.current.rotation.y = time * 0.004;
    ref.current.rotation.x = Math.sin(time * 0.07) * 0.016;
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

function AuraGlow({ entity, company }) {
  const signals = getSignals(entity, company);
  const palette = getAuraPalette(signals, company);

  return (
    <mesh>
      <sphereGeometry args={[3.75, 48, 48]} />
      <meshBasicMaterial
        transparent
        color={palette.secondary}
        opacity={0.025 + signals.health * 0.035}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function EntityAura({ entity, company }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#030406]">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.035)_44%,rgba(3,4,6,0.84)_100%)]" />

      <Canvas
        dpr={[1, 1.25]}
        camera={{
          position: [0, 0.3, 5.9],
          fov: 48,
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

        <group position={[0, -0.55, 0]} scale={1.75}>
          <AuraDust />
          <AuraGlow entity={entity} company={company} />
          <AuraRings entity={entity} company={company} />
          <FractureSignature entity={entity} company={company} />
          <AuraParticles entity={entity} company={company} />
          <AuraCore entity={entity} company={company} />
        </group>
      </Canvas>
    </div>
  );
}