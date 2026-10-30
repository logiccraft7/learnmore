import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'
import { QUALITY, useSettings } from './state/settings'
import { Scene } from './world/Scene'
import { TitleScreen } from './ui/TitleScreen'
import { Hud } from './ui/Hud'
import { PauseMenu } from './ui/PauseMenu'
import { TouchControls } from './ui/TouchControls'
import { Loading } from './ui/Loading'

export function App() {
  const quality = useSettings((s) => s.quality)
  const q = QUALITY[quality]
  return (
    <div className="app">
      <Canvas
        key={quality /* remount on quality change so renderer options apply */}
        dpr={q.dpr}
        shadows={q.shadows ? 'soft' : false}
        camera={{ fov: 70, near: 0.1, far: 700 }}
        gl={{ antialias: !q.post, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Loading />
      <Hud />
      <TouchControls />
      <PauseMenu />
      <TitleScreen />
    </div>
  )
}
