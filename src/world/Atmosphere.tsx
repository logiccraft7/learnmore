import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useMemo } from 'react'
import * as THREE from 'three'
import { createRng } from '../sim/rng'
import { QUALITY, useSettings } from '../state/settings'
import { softDisc } from './textures'

export const FOG_COLOR = '#0f1824'

/** Night sky: gradient dome, a hazy moon and a sprinkle of stars above the smog. */
export function Sky() {
  const dome = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color('#05070d') }, horizon: { value: new THREE.Color('#1f2a3c') }, glow: { value: new THREE.Color('#4a3a3a') } },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; varying vec3 vDir;
          void main(){ float h = clamp(vDir.y, 0.0, 1.0);
            vec3 c = mix(horizon, top, pow(h, 0.55));
            c += glow * pow(1.0 - h, 6.0) * 0.6; // city light pollution on the horizon
            gl_FragColor = vec4(c, 1.0); }`,
      }),
    [],
  )
  const stars = useMemo(() => {
    const rng = createRng(1925)
    const pts: number[] = []
    for (let i = 0; i < 400; i++) {
      const theta = rng.range(0, Math.PI * 2)
      const y = rng.range(0.25, 1)
      const r = Math.sqrt(1 - y * y)
      pts.push(Math.cos(theta) * r * 400, y * 400, Math.sin(theta) * r * 400)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])
  return (
    <group>
      <mesh material={dome} scale={450} renderOrder={-1}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      <points geometry={stars}>
        <pointsMaterial size={1.2} sizeAttenuation={false} color="#9aa6c0" fog={false} transparent opacity={0.7} />
      </points>
      <sprite position={[-120, 160, 220]} scale={[70, 70, 1]}>
        <spriteMaterial map={softDisc()} color={[1.6, 1.55, 1.35]} fog={false} toneMapped={false} depthWrite={false} />
      </sprite>
      <sprite position={[-120, 160, 220]} scale={[16, 16, 1]}>
        <spriteMaterial map={softDisc()} color={[3, 2.9, 2.6]} fog={false} toneMapped={false} depthWrite={false} />
      </sprite>
    </group>
  )
}

export function Lighting() {
  const shadows = QUALITY[useSettings((s) => s.quality)].shadows
  return (
    <group>
      <hemisphereLight args={['#5a6d94', '#2a1f18', 1.25]} />
      <ambientLight intensity={0.25} color="#8090b0" />
      <directionalLight
        position={[-40, 70, 50]}
        intensity={0.9}
        color="#a8b8ff"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={200}
        shadow-bias={-0.0005}
      />
    </group>
  )
}

/** Film look: bloom on lamps and windows, vignette, grain. Off on low quality. */
export function Effects() {
  const quality = useSettings((s) => s.quality)
  if (!QUALITY[quality].post) return null
  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
      <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.72} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.35} />
    </EffectComposer>
  )
}
