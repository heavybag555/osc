import { TVChassis } from './TVChassis'

export function OscilloscopeScene() {
  return (
    <>
      <color attach="background" args={['#050505']} />
      <TVChassis />
    </>
  )
}

