import { useMemo } from 'react'
import { generateStreet } from './layout'
import { Buildings } from './Buildings'
import { Street } from './Street'
import { Player } from './Player'
import { Effects, FOG_COLOR, Lighting, Sky } from './Atmosphere'

export const WORLD_SEED = 1925

export function Scene() {
  const layout = useMemo(() => generateStreet(WORLD_SEED), [])
  return (
    <>
      <color attach="background" args={[FOG_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, 16, 95]} />
      <Sky />
      <Lighting />
      <Buildings buildings={layout.buildings} />
      <Street layout={layout} />
      <Player spawn={layout.spawn} colliders={layout.colliders} />
      <Effects />
    </>
  )
}
