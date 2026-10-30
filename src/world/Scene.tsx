import { street } from '../state/world'
import { Buildings } from './Buildings'
import { Street } from './Street'
import { Player } from './Player'
import { Effects, FOG_COLOR, Lighting, Sky } from './Atmosphere'

export function Scene() {
  const layout = street
  return (
    <>
      <color attach="background" args={[FOG_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, 16, 95]} />
      <Sky />
      <Lighting />
      <Buildings buildings={layout.buildings} />
      <Street layout={layout} />
      <Player colliders={layout.colliders} />
      <Effects />
    </>
  )
}
