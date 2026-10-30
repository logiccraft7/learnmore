import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createRng } from '../sim/rng'
import { useSettings, QUALITY } from '../state/settings'
import { FACADE_X, ROAD_HALF, STREET_HALF_LENGTH, type StreetLayout } from './layout'
import { Model, glowMaterials } from './models'
import { lightNow } from './Atmosphere'
import { bricks, cobblestones, pavement, softDisc, toonRamp } from './textures'

const LAMP_COLOR = '#ffb866'

function Ground() {
  const road = useMemo(() => {
    const t = cobblestones().clone()
    t.repeat.set(30 / 4, 140 / 4)
    t.needsUpdate = true
    return t
  }, [])
  const walk = useMemo(() => {
    const t = pavement().clone()
    t.repeat.set(3 / 1.5, (2 * STREET_HALF_LENGTH) / 1.5)
    t.needsUpdate = true
    return t
  }, [])
  const swW = FACADE_X - ROAD_HALF
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 140]} />
        <meshToonMaterial map={road} gradientMap={toonRamp()} color="#9aa2b0" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (ROAD_HALF + swW / 2), 0.07, 0]} receiveShadow>
            <boxGeometry args={[swW, 0.14, 2 * STREET_HALF_LENGTH]} />
            <meshToonMaterial map={walk} gradientMap={toonRamp()} />
          </mesh>
          <mesh position={[side * (ROAD_HALF + 0.08), 0.08, 0]}>
            <boxGeometry args={[0.18, 0.16, 2 * STREET_HALF_LENGTH]} />
            <meshToonMaterial color="#8a8478" gradientMap={toonRamp()} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Lamps({ layout }: { layout: StreetLayout }) {
  const lights = useRef<THREE.PointLight[]>([])
  useFrame(({ clock }) => {
    const { night } = lightNow(clock.elapsedTime)
    // Lamps are lit from dusk to dawn; by day they're just iron posts.
    for (const l of lights.current) if (l) l.intensity = 14 * night
    poolMat.opacity = night
    for (const m of glowMaterials) m.color.copy(m.userData.baseColor).multiplyScalar(0.12 + 0.88 * night)
  })
  const poolMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: softDisc(),
        color: new THREE.Color(LAMP_COLOR).multiplyScalar(0.55),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  return (
    <group>
      {layout.lamps.map((l, i) => (
        <group key={i} position={[l.x, 0.14, l.z]}>
          <Model name="gas_lamp" rotation={[0, l.x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} />
          <pointLight ref={(r) => r && (lights.current[i] = r)} position={[0, 3.3, 0]} color={LAMP_COLOR} intensity={14} distance={13} decay={1.5} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={poolMat}>
            <planeGeometry args={[9, 9]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function AlleyWalls({ layout }: { layout: StreetLayout }) {
  return (
    <group>
      {layout.alleyWalls.map((w, i) => {
        const sx = w.box.x1 - w.box.x0
        const sz = w.box.z1 - w.box.z0
        return (
          <mesh key={i} position={[(w.box.x0 + w.box.x1) / 2, w.height / 2, (w.box.z0 + w.box.z1) / 2]} castShadow receiveShadow>
            <boxGeometry args={[sx, w.height, sz]} />
            <meshToonMaterial color="#4a3a34" map={bricks()} gradientMap={toonRamp()} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Steam drifting up from manholes: the cheapest way to make a night street feel alive. */
function Steam({ x, z, seed }: { x: number; z: number; seed: number }) {
  const puffs = useMemo(() => {
    const rng = createRng(seed)
    return Array.from({ length: 14 }, () => ({ phase: rng.next(), drift: rng.range(-0.4, 0.4), size: rng.range(1.2, 2.4) }))
  }, [seed])
  const refs = useRef<THREE.Sprite[]>([])
  const mats = useMemo(
    () => puffs.map(() => new THREE.SpriteMaterial({ map: softDisc(), color: '#8fa0b8', transparent: true, depthWrite: false, opacity: 0 })),
    [puffs],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.18
    puffs.forEach((p, i) => {
      const s = refs.current[i]
      if (!s) return
      const k = (t + p.phase) % 1
      s.position.set(x + p.drift * k * 3, 0.2 + k * 4.5, z + Math.sin(k * 6 + i) * 0.3)
      const size = p.size * (0.5 + k)
      s.scale.set(size, size, 1)
      mats[i].opacity = 0.22 * Math.sin(Math.PI * k)
    })
  })
  return (
    <group>
      {puffs.map((_, i) => (
        <sprite key={i} ref={(s) => s && (refs.current[i] = s)} material={mats[i]} />
      ))}
    </group>
  )
}

function Manholes({ layout }: { layout: StreetLayout }) {
  const steam = QUALITY[useSettings((s) => s.quality)].steam
  return (
    <group>
      {layout.manholes.map((m, i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[m.x, 0.015, m.z]}>
            <circleGeometry args={[0.45, 18]} />
            <meshToonMaterial color="#26282c" gradientMap={toonRamp()} />
          </mesh>
          {steam && <Steam x={m.x} z={m.z} seed={i + 1} />}
        </group>
      ))}
    </group>
  )
}

function StreetProps({ layout }: { layout: StreetLayout }) {
  return (
    <group>
      {layout.props.map((p, i) => (
        <Model key={i} name={p.kind} position={[p.x, Math.abs(p.x) > ROAD_HALF && Math.abs(p.x) < FACADE_X ? 0.14 : 0, p.z]} rotation={[0, p.rotY, 0]} />
      ))}
      {layout.cars.map((c, i) => (
        <Model key={`car${i}`} name={c.model} position={[c.x, 0, c.z]} rotation={[0, c.rotY, 0]} />
      ))}
      {layout.buildings
        .filter((b) => b.waterTower)
        .map((b) => {
          // Water tower sits back from the facade on the roof.
          const back = new THREE.Vector3(b.width * 0.15, 0, -b.depth * 0.55).applyAxisAngle(new THREE.Vector3(0, 1, 0), b.rotY)
          return <Model key={`wt${b.id}`} name="watertower" position={[b.px + back.x, b.floors * b.floorH + 0.6, b.pz + back.z]} />
        })}
    </group>
  )
}

export function Street({ layout }: { layout: StreetLayout }) {
  return (
    <group>
      <Ground />
      <Lamps layout={layout} />
      <AlleyWalls layout={layout} />
      <Manholes layout={layout} />
      <StreetProps layout={layout} />
    </group>
  )
}
