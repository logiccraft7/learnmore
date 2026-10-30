import { useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { hourOfDay } from '../sim/clock'
import { START_MINUTES } from '../sim/game'
import { createRng } from '../sim/rng'
import { QUALITY, useSettings } from '../state/settings'
import { useWorld } from '../state/world'
import { daylight, type Daylight } from './daylight'
import { softDisc } from './textures'

export const FOG_COLOR = '#0f1824'

/** Current hour of the game clock (the title screen shows the opening evening). */
export const currentHour = () => hourOfDay(useWorld.getState().game?.minutes ?? START_MINUTES)

/** Light for this frame, computed once per frame and shared by everything that needs it. */
let frameLight: Daylight = daylight(currentHour())
let frameStamp = -1
export function lightNow(clockTime: number): Daylight {
  if (clockTime !== frameStamp) {
    frameStamp = clockTime
    frameLight = daylight(currentHour())
  }
  return frameLight
}

/** Sky dome with a day/night gradient, stars, the moon by night and the sun by day. */
export function Sky() {
  const dome = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, glow: { value: new THREE.Color() } },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; varying vec3 vDir;
          void main(){ float h = clamp(vDir.y, 0.0, 1.0);
            vec3 c = mix(horizon, top, pow(h, 0.55));
            c += glow * pow(1.0 - h, 6.0) * 0.6;
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
  const starMat = useRef<THREE.PointsMaterial>(null!)
  const moon = useRef<THREE.Group>(null!)
  const sun = useRef<THREE.Sprite>(null!)
  const sunMat = useRef<THREE.SpriteMaterial>(null!)

  useFrame(({ clock }) => {
    const l = lightNow(clock.elapsedTime)
    dome.uniforms.top.value.copy(l.skyTop)
    dome.uniforms.horizon.value.copy(l.skyHorizon)
    dome.uniforms.glow.value.copy(l.skyGlow)
    starMat.current.opacity = 0.7 * l.night
    moon.current.visible = l.night > 0.05
    moon.current.scale.setScalar(Math.max(0.001, l.night))
    sun.current.visible = l.sun > 0.01
    sun.current.position.copy(l.lightDir).multiplyScalar(380)
    sunMat.current.opacity = l.sun
  })

  return (
    <group>
      <mesh material={dome} scale={450} renderOrder={-1}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      <points geometry={stars}>
        <pointsMaterial ref={starMat} size={1.2} sizeAttenuation={false} color="#9aa6c0" fog={false} transparent opacity={0.7} />
      </points>
      <group ref={moon} position={[-120, 160, 220]}>
        <sprite scale={[70, 70, 1]}>
          <spriteMaterial map={softDisc()} color={[1.6, 1.55, 1.35]} fog={false} toneMapped={false} depthWrite={false} />
        </sprite>
        <sprite scale={[16, 16, 1]}>
          <spriteMaterial map={softDisc()} color={[3, 2.9, 2.6]} fog={false} toneMapped={false} depthWrite={false} />
        </sprite>
      </group>
      <sprite ref={sun} scale={[60, 60, 1]}>
        <spriteMaterial ref={sunMat} map={softDisc()} color={[3, 2.6, 1.9]} fog={false} toneMapped={false} depthWrite={false} transparent />
      </sprite>
    </group>
  )
}

/** Sun/moon key light, sky fill, fog and background, all following the clock. */
export function Lighting() {
  const shadows = QUALITY[useSettings((s) => s.quality)].shadows
  const scene = useThree((s) => s.scene)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const key = useRef<THREE.DirectionalLight>(null!)
  useFrame(({ clock }) => {
    const l = lightNow(clock.elapsedTime)
    hemi.current.color.copy(l.hemiSky)
    hemi.current.groundColor.copy(l.hemiGround)
    hemi.current.intensity = l.hemiIntensity
    key.current.color.copy(l.lightColor)
    key.current.intensity = l.lightIntensity
    key.current.position.copy(l.lightDir).multiplyScalar(90)
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(l.fog)
      // Haze thins out in daylight so the far end of the street is visible.
      scene.fog.far = 95 + 70 * (1 - l.night)
    }
    if (scene.background instanceof THREE.Color) scene.background.copy(l.fog)
  })
  return (
    <group>
      <hemisphereLight ref={hemi} args={['#5a6d94', '#2a1f18', 1.25]} />
      <ambientLight intensity={0.25} color="#8090b0" />
      <directionalLight
        ref={key}
        position={[-40, 70, 50]}
        intensity={0.9}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={250}
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
