import React, { useState, useRef, useEffect, useMemo } from 'react'
import { parse } from './util/ppm'

const path = `${process.env.PUBLIC_URL}/sample-data/black-hole/frames/frame623.ppm`

export default function SamplePPM () {
  const canvas = useRef()
  const [imageData, setImageData] = useState(null)

  useEffect(() => {
    fetch(path)
      .then(res => res.arrayBuffer())
      .then(img => setImageData(parse(img)))
      .catch(e => { throw e })
  }, [])

  const [width, height] = useMemo(() => imageData ? [imageData.width, imageData.height] : [0, 0], [imageData])

  useEffect(() => {
    if (!imageData) return;
    console.log('imageData', imageData)
    const ctx = canvas.current.getContext('2d')
    ctx.clearRect(0, 0, imageData.width, imageData.height)
    ctx.putImageData(imageData, 0, 0)
  }, [imageData])

  return <canvas ref={canvas} width={width} height={height} />
}
