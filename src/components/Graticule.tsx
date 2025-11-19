import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

export function Graticule() {
  const { lines } = useMemo(() => {
    const divisions = 8
    const size = 6
    const step = size / divisions
    const linesData = []

    for (let i = -divisions / 2; i <= divisions / 2; i++) {
      const pos = i * step
      // Vertical
      linesData.push({
        points: [[pos, -size / 2, 0], [pos, size / 2, 0]] as [number, number, number][],
        key: `v-${i}`
      })
      // Horizontal
      linesData.push({
        points: [[-size / 2, pos, 0], [size / 2, pos, 0]] as [number, number, number][],
        key: `h-${i}`
      })
    }
    return { lines: linesData }
  }, [])

  return (
    <group position={[0, 0, -0.5]}>
      {lines.map((line, index) => (
        <Line
          key={line.key}
          points={line.points}
          color="#004433"
          lineWidth={1}
          transparent
          opacity={0.3}
        />
      ))}
      
      {/* Center Axis */}
      <Line points={[[0, -3, 0], [0, 3, 0]]} color="#006655" lineWidth={2} opacity={0.6} transparent />
      <Line points={[[-3, 0, 0], [3, 0, 0]]} color="#006655" lineWidth={2} opacity={0.6} transparent />
    </group>
  )
}

