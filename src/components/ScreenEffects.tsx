import { EffectComposer, Bloom, Vignette, Noise, Scanline, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useControls } from 'leva'
import * as THREE from 'three'

export function ScreenEffects() {
  const { bloomIntensity, bloomThreshold, noiseOpacity, vignetteDarkness } = useControls('Screen Effects', {
    bloomIntensity: { value: 2, min: 0, max: 10 },
    bloomThreshold: { value: 0.2, min: 0, max: 1 },
    noiseOpacity: { value: 0.15, min: 0, max: 0.5 },
    vignetteDarkness: { value: 0.6, min: 0, max: 1 }
  })

  return (
    <EffectComposer>
      <Bloom 
        luminanceThreshold={bloomThreshold} 
        mipmapBlur 
        intensity={bloomIntensity} 
        radius={0.8}
      />
      <ChromaticAberration 
        offset={new THREE.Vector2(0.002, 0.002)} 
        radialModulation={false} 
        modulationOffset={0}
      />
      <Scanline
        density={1.5}
        scrollSpeed={0.1}
        opacity={0.1}
      />
      <Noise opacity={noiseOpacity} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.1} darkness={vignetteDarkness} />
    </EffectComposer>
  )
}

