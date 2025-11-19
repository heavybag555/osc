import { MeshPortalMaterial, RoundedBox } from '@react-three/drei'
import { LissajousBeam } from './LissajousBeam'
import { Graticule } from './Graticule'
import { ScreenEffects } from './ScreenEffects'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

export function TVChassis() {
  const portalMaterial = useRef<any>(null)

  // Create a noise texture for the TV body
  const noiseTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      const imageData = ctx.createImageData(1024, 1024)
      const data = imageData.data
      
      // Generate INTENSE fine-grain noise
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 150 - 75 // Range: -75 to +75 (MAXIMUM GRAIN!)
        data[i] = 26 + noise     // R
        data[i + 1] = 26 + noise // G
        data[i + 2] = 26 + noise // B
        data[i + 3] = 255        // A
      }
      
      ctx.putImageData(imageData, 0, 0)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(12, 12) // Much more repetition for ultra-fine grainy detail
    
    return texture
  }, [])

  return (
    <group rotation={[0, -0.2, 0]}>
      {/* TV Body */}
      <RoundedBox args={[6.5, 5.5, 4]} radius={0.5} smoothness={8} position={[0, 0, -1]}>
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.4} 
          metalness={0.3}
          map={noiseTexture}
        />
      </RoundedBox>
      
      {/* Screen Frame */}
      <RoundedBox args={[5.2, 4.2, 0.5]} radius={0.2} smoothness={4} position={[0, 0, 1.0]}>
        <meshStandardMaterial 
          color="#111" 
          roughness={0.8}
          map={noiseTexture}
        />
      </RoundedBox>

      {/* The Screen Surface with Portal */}
      <mesh position={[0, 0, 1.26]}>
        <planeGeometry args={[4.8, 3.8]} />
        <MeshPortalMaterial ref={portalMaterial}>
           <color attach="background" args={['#001a1a']} />
           
           {/* Everything inside here is the "virtual world" of the oscilloscope screen */}
           <group scale={[0.8, 0.8, 0.8]}>
             <Graticule />
             <LissajousBeam />
             <ScreenEffects />
           </group>
           
        </MeshPortalMaterial>
      </mesh>
      
      {/* Glass Reflection Overlay */}
      <mesh position={[0, 0, 1.27]}>
         <planeGeometry args={[4.8, 3.8]} />
         <meshPhysicalMaterial 
            roughness={0.2} 
            transmission={0.9} 
            thickness={0.1} 
            transparent 
            opacity={0.2}
            color="#ccffee"
         />
      </mesh>
    </group>
  )
}

