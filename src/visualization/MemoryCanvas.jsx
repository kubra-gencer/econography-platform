import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { dataToVisualParams } from "./systems/dataToVisualParams";

function MemoryDust({ visual }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const array = new Float32Array(visual.dustCount * 3);

    for (let i = 0; i < visual.dustCount; i++) {
      array[i * 3] = (Math.random() - 0.5) * 16;
      array[i * 3 + 1] = (Math.random() - 0.5) * 9;
      array[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }

    return array;
  }, [visual.dustCount]);

  useFrame((state) => {
    if (!ref.current) return;

    const time = state.clock.getElapsedTime();

    ref.current.rotation.y = time * 0.006;
    ref.current.rotation.x = Math.sin(time * 0.08) * 0.018;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={visual.secondaryColor}
        size={0.008}
        sizeAttenuation
        depthWrite={false}
        opacity={0.08}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function MemoryField({ visual }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const array = new Float32Array(visual.particleCount * 3);

    for (let i = 0; i < visual.particleCount; i++) {
      const radius =
        1.2 +
        Math.pow(Math.random(), 0.58) *
          (3.2 + visual.pressure * 1.2);

      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * (2.4 + visual.volume * 2.2);

      const spiral = angle + radius * 0.55;

      array[i * 3] = Math.cos(spiral) * radius;
      array[i * 3 + 1] = height;
      array[i * 3 + 2] = Math.sin(spiral) * radius;
    }

    return array;
  }, [visual.particleCount, visual.pressure, visual.volume]);

  useFrame((state) => {
    if (!ref.current) return;

    const time = state.clock.getElapsedTime();
    const geometry = ref.current.geometry;
    const array = geometry.attributes.position.array;

    ref.current.rotation.y =
      time * visual.speed * (1.2 + visual.liquidity);

    ref.current.rotation.x =
      Math.sin(time * 0.12) * 0.08 * visual.volatility;

    ref.current.rotation.z =
      Math.sin(time * 0.18) * 0.04 * visual.risk;

    for (let i = 0; i < visual.particleCount; i++) {
      const x = array[i * 3];
      const y = array[i * 3 + 1];
      const z = array[i * 3 + 2];

      const wave =
        Math.sin(time * (0.45 + visual.volatility) + y * 1.2) *
        0.0018 *
        visual.turbulence;

      const drag =
        Math.cos(time * 0.28 + z * 0.9) *
        0.0012 *
        visual.distortion;

      array[i * 3] += wave;
      array[i * 3 + 1] += drag * visual.risk;
      array[i * 3 + 2] +=
        Math.sin(time * 0.22 + x) *
        0.001 *
        visual.turbulence;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={visual.primaryColor}
        size={0.012 + visual.volume * 0.012}
        sizeAttenuation
        depthWrite={false}
        opacity={0.18 + visual.coherence * 0.14}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function SignalTerrain({ visual }) {
  const groupRef = useRef();
  const materialRefs = useRef([]);

  const terrainLines = useMemo(() => {
    const lines = [];
    const lineCount = visual.terrainDensity;
    const resolution = visual.terrainResolution;
    const width = 15.8 * visual.fieldCompression;
    const depth = 7.8;

    for (let row = 0; row < lineCount; row++) {
      const rowProgress = lineCount <= 1 ? 0 : row / (lineCount - 1);
      const yBase = (rowProgress - 0.5) * depth;
      const rowPhase = rowProgress * Math.PI * 4.0;
      const rowEnergy = 0.55 + Math.sin(rowProgress * Math.PI) * 0.55;
      const points = [];

      for (let col = 0; col < resolution; col++) {
        const colProgress = resolution <= 1 ? 0 : col / (resolution - 1);
        const x = (colProgress - 0.5) * width;
        const centerPull = Math.max(0, 1 - Math.abs(colProgress - 0.5) * 1.55);
        const edgeFalloff = Math.sin(colProgress * Math.PI);
        const waveA = Math.sin(colProgress * Math.PI * visual.waveFrequency + rowPhase);
        const waveB = Math.cos(colProgress * Math.PI * (visual.waveFrequency * 0.52 + 1.4) - rowPhase * 0.72);
        const waveC = Math.sin(colProgress * Math.PI * 13.0 + rowPhase * 1.35) * visual.fractureIntensity;
        const liquidityDrift = Math.sin((colProgress - rowProgress) * Math.PI * 2.0) * visual.flowContinuity;
        const stressBreak = Math.sin((colProgress + rowProgress) * Math.PI * 11.0) * visual.fractureIntensity;

        const y =
          yBase +
          waveA * visual.waveAmplitude * 0.52 * rowEnergy * edgeFalloff +
          waveB * visual.waveAmplitude * 0.26 * visual.flowContinuity +
          waveC * 0.075 * edgeFalloff +
          liquidityDrift * 0.11 +
          stressBreak * 0.052;

        const z =
          -0.62 +
          Math.sin(rowProgress * Math.PI) * 0.95 +
          centerPull * visual.fieldIntensity * 0.92 +
          edgeFalloff * visual.heatBloom * 0.24 +
          Math.cos(colProgress * Math.PI * 3.2 + rowPhase) * 0.16 * visual.turbulence;

        points.push(new THREE.Vector3(x, y, z));
      }

      lines.push({
        points,
        rowProgress,
        rowEnergy,
      });
    }

    return lines;
  }, [
    visual.terrainDensity,
    visual.terrainResolution,
    visual.fieldCompression,
    visual.waveFrequency,
    visual.waveAmplitude,
    visual.flowContinuity,
    visual.fractureIntensity,
    visual.fieldIntensity,
    visual.turbulence,
  ]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(time * 0.08) * 0.035 * visual.volatility;
      groupRef.current.rotation.x = -0.34 + Math.cos(time * 0.06) * 0.045;
      groupRef.current.position.y = Math.sin(time * 0.18) * 0.035;
      groupRef.current.position.z = 0.35 + Math.cos(time * 0.12) * 0.06;
    }

    materialRefs.current.forEach((material, index) => {
      if (!material) return;

      const rowPulse = Math.sin(time * (0.42 + visual.speed * 4.0) + index * 0.42);
      const heatPulse = Math.cos(time * 0.28 + index * 0.21);

      material.opacity =
        0.2 +
        visual.fieldIntensity * 0.42 +
        rowPulse * 0.045 +
        Math.max(0, heatPulse) * visual.heatBloom * 0.12;
    });
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0.35]} scale={[1.18, 0.82, 1]}>
      {terrainLines.map((line, index) => {
        const isStressLine = line.rowProgress > 0.68 && visual.fractureIntensity > 0.48;
        const color = isStressLine
          ? visual.fractureColor
          : line.rowProgress > 0.52
          ? visual.heatColor
          : visual.terrainColor;

        return (
          <Line
            key={`signal-terrain-${index}`}
            points={line.points}
            color={color}
            lineWidth={1.2 + line.rowEnergy * 1.05 + visual.fieldIntensity * 1.25}
            transparent
            opacity={0.38 + visual.fieldIntensity * 0.36}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            ref={(node) => {
              materialRefs.current[index] = node?.material || null;
            }}
          />
        );
      })}
    </group>
  );
}

function TerrainParticles({ visual }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const count = Math.round(visual.flowCount * 2.8);
    const array = new Float32Array(count * 3);
    const width = 14.8 * visual.fieldCompression;
    const depth = 7.2;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const lane = Math.sin(t * Math.PI * 16.0 + visual.volume * 3.0);
      const scatter = Math.pow(Math.random(), 1.8);
      const x = (Math.random() - 0.5) * width;
      const y = lane * depth * 0.32 + (Math.random() - 0.5) * depth * 0.52;
      const centerPull = Math.max(0, 1 - Math.abs(x / width) * 1.7);
      const z = 0.05 + centerPull * 1.05 + scatter * 0.52;

      array[i * 3] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = z;
    }

    return array;
  }, [visual.flowCount, visual.fieldCompression, visual.volume]);

  useFrame((state) => {
    if (!ref.current) return;

    const time = state.clock.getElapsedTime();
    const geometry = ref.current.geometry;
    const array = geometry.attributes.position.array;

    ref.current.rotation.x = -0.22;
    ref.current.rotation.z = Math.sin(time * 0.07) * 0.025 * visual.volatility;

    for (let i = 0; i < array.length / 3; i++) {
      const x = array[i * 3];
      const y = array[i * 3 + 1];
      const drift = Math.sin(time * 0.24 + y * 1.8 + x * 0.12) * 0.0018 * visual.flowContinuity;
      const pressure = Math.cos(time * 0.2 + x * 0.7) * 0.0014 * visual.turbulence;

      array[i * 3] += drift;
      array[i * 3 + 1] += pressure;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} position={[0, -0.04, 0.82]} scale={[1.28, 0.88, 1]}>
      <PointMaterial
        transparent
        color={visual.heatColor}
        size={0.026 + visual.volume * 0.024}
        sizeAttenuation
        depthWrite={false}
        opacity={0.68 + visual.grainIntensity * 0.46}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function FlowVeins({ visual }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const array = new Float32Array(visual.flowCount * 3);

    for (let i = 0; i < visual.flowCount; i++) {
      const t = i / visual.flowCount;
      const angle = t * Math.PI * 10 + Math.random() * 0.8;
      const radius = 1.2 + Math.sin(t * Math.PI * 4) * 1.8 + Math.random();

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = (t - 0.5) * 4.4 + (Math.random() - 0.5) * 0.7;
      array[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return array;
  }, [visual.flowCount]);

  useFrame((state) => {
    if (!ref.current) return;

    const time = state.clock.getElapsedTime();

    ref.current.rotation.y =
      -time * (0.012 + visual.liquidity * 0.025);

    ref.current.rotation.x =
      Math.cos(time * 0.16) * 0.05 * visual.coherence;

    ref.current.scale.setScalar(
      0.95 + Math.sin(time * 0.45) * 0.025 * visual.liquidity
    );
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={visual.accentColor}
        size={0.016}
        sizeAttenuation
        depthWrite={false}
        opacity={0.12 + visual.liquidity * 0.16}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function MemoryCore({ visual }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;

    const time = state.clock.getElapsedTime();

    ref.current.rotation.y = time * (0.035 + visual.volatility * 0.08);
    ref.current.rotation.x = Math.sin(time * 0.26) * 0.12 * visual.risk;

    ref.current.scale.setScalar(
      1 +
        Math.sin(time * 0.7) * 0.035 * visual.liquidity +
        visual.risk * 0.08
    );
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.28 + visual.volume * 0.35, 5]} />
      <meshBasicMaterial
        wireframe
        transparent
        color={visual.secondaryColor}
        opacity={0.025 + visual.risk * 0.045}
      />
    </mesh>
  );
}

function AtmosphereShell({ visual }) {
  return (
    <mesh>
      <sphereGeometry args={[3.6 + visual.pressure * 0.6, 48, 48]} />
      <meshBasicMaterial
        transparent
        color={visual.secondaryColor}
        opacity={visual.glow * 0.62}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function MemoryCanvas({ entity, pulse }) {
  const visual = useMemo(
    () => dataToVisualParams(entity, pulse),
    [entity, pulse]
  );

  return (
    <div className="memory-canvas-shell relative h-full w-full overflow-hidden bg-[#030406]">
      <div className="memory-canvas-heat pointer-events-none absolute inset-0 z-[1]" />
      <div className="memory-canvas-grain pointer-events-none absolute inset-0 z-[2]" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.08)_38%,rgba(3,4,6,0.9)_100%)]" />

      <Canvas
        dpr={[1, 1.25]}
      camera={{
  position: [0, 0, 7.1],
  fov: 52,
}}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#030406"]} />
        <fog attach="fog" args={["#030406", 5.5, 14]} />

        <ambientLight intensity={0.34} />

        <pointLight
          position={[3.5, 2.2, 4]}
          intensity={0.9}
          color={visual.secondaryColor}
        />

        <pointLight
          position={[-3.2, -2.2, 4]}
          intensity={0.45}
          color={visual.accentColor}
        />

       <group position={[0, 0, 0]} scale={1.35}>
  <MemoryDust visual={visual} />
  <AtmosphereShell visual={visual} />
  <MemoryCore visual={visual} />
  <FlowVeins visual={visual} />
  <MemoryField visual={visual} />
  <SignalTerrain visual={visual} />
  <TerrainParticles visual={visual} />
</group>
      </Canvas>
    </div>
  );
}