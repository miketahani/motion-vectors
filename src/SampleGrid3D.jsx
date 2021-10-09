import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { Color as THREEColor } from 'three'

import Spinner from './Spinner'

// one color cube per data point
// color determined by pixel color under the point coordinates

import { parse } from './util/ppm'

const vectorPath = `${process.env.PUBLIC_URL}/sample-data/black-hole/mv/623.json`
const framePath = `${process.env.PUBLIC_URL}/sample-data/black-hole/frames/frame623.ppm`

function Box ({ color, ...props }) {
  return (
    <mesh {...props}>
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
      <meshBasicMaterial attach="material" color={color} />
    </mesh>
  )
}

export function SampleGrid3D () {
  const [imageData, setImageData] = useState(null)
  const [vectorData, setVectorData] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(vectorPath)
        .then(res => res.json())
        .then(vectors => setVectorData(vectors.filter(d => d.source === 1)))
        .catch(e => { throw e }),

      fetch(framePath)
        .then(res => res.arrayBuffer())
        .then(img => setImageData(parse(img)))
        .catch(e => { throw e })
    ])
    .then(() => setIsReady(true))
  }, [])

  const [width, height] = useMemo(() => imageData ? [imageData.width, imageData.height] : [0, 0], [imageData])
  const ctx = useMemo(() => (new OffscreenCanvas(width, height)).getContext('2d'), [width, height])

  useEffect(() => {
    if (!imageData) return;
    ctx.clearRect(0, 0, imageData.width, imageData.height)
    ctx.putImageData(imageData, 0, 0)
  }, [imageData, ctx])

  const cellSize = useMemo(
    () => vectorData ? [vectorData[0].width, vectorData[0].height] : [0, 0],
    [vectorData]
  )

  const getBoxProps = (x, y) => {
    const colorData = Array.from(ctx.getImageData(x, y, 1, 1).data).slice(0, 3)
    return {
      position: [
        x / imageData.width * cellSize[0] - cellSize[0] / 2,
        y / imageData.height * cellSize[1] - cellSize[1] / 2,
        0
      ],
      color: new THREEColor(`rgb(${colorData})`)
    }
  }

  if (!isReady) {
    return <Spinner />
  }

  return (
    <Canvas style={{height: window.innerHeight}} colorManagement>
      {vectorData.map(({ src_x, src_y }, i) =>
        <Box
          {...getBoxProps(src_x, src_y)}
          key={i}
        />
      )}
    </Canvas>
  )
}
