import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls } from 'leva'
import { Line } from '@react-three/drei'

export function LissajousBeam() {
  const { freqX, freqY, freqZ, delta, speed, samples, radius, color, lineWidth } = useControls('Beam', {
    freqX: { value: 5, min: 1, max: 20, step: 0.1 },
    freqY: { value: 4, min: 1, max: 20, step: 0.1 },
    freqZ: { value: 3, min: 1, max: 20, step: 0.1 },
    delta: { value: Math.PI / 2, min: 0, max: Math.PI * 2 },
    speed: { value: 0.2, min: 0, max: 2 },
    samples: { value: 1000, min: 100, max: 5000, step: 50 },
    radius: { value: 2.5, min: 0.5, max: 4 },
    color: '#55ff55',
    lineWidth: { value: 2, min: 0.1, max: 5 }
  })

  const ref = useRef<any>(null)
  const [points, setPoints] = useState<THREE.Vector3[]>([])
  
  // Boost color for HDR bloom
  const glowColor = useMemo(() => new THREE.Color(color).multiplyScalar(2), [color])

  // We'll use a ref to track total time for smooth animation
  const timeRef = useRef(0)

  useFrame((_state, deltaT) => {
    timeRef.current += deltaT * speed
    
    // Calculate the full curve for this frame
    const newPoints = []
    const tOffset = timeRef.current
    
    for (let i = 0; i <= samples; i++) {
      // Normalized t from 0 to 2PI (one full cycle of the slowest freq usually, 
      // but for lissajous we want enough to close the loop or look complex)
      // We map i to a parameter t.
      const t = (i / samples) * Math.PI * 2
      
      // The "moving" effect comes from adding tOffset to the phase
      const x = Math.sin(freqX * t + tOffset) * radius
      const y = Math.sin(freqY * t + delta) * radius
      const z = Math.sin(freqZ * t) * radius
      
      newPoints.push(new THREE.Vector3(x, y, z))
    }
    setPoints(newPoints)
  })

  return (
    <Line
      ref={ref}
      points={points}
      color={glowColor}
      lineWidth={lineWidth}
      toneMapped={false} // Important for bloom!
    />
  )
}

