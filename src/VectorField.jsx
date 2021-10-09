import React, { useState, useRef, useEffect, useMemo } from 'react'
import Spinner from './Spinner'
import useBatchFetch from './useBatchFetch'
import { parse as parsePPM } from './util/ppm'
import { timer } from './util/timer'
import './Visualize2D.css'

const PARAMS = new URLSearchParams(window.location.search)
const IS_DEBUG = PARAMS.get('debug') !== null
const WITH_ARROWS = PARAMS.get('arrows') !== null
const DATA_SUBDIR = PARAMS.get('data') || 'black-hole'
const IS_STACKED = PARAMS.get('stacked') !== null

const DATA_DIR = `${process.env.PUBLIC_URL}/sample-data/${DATA_SUBDIR}`

// Hardcoded info about the videos; corresponds to folder name
const videoMetadata = {
  bird: {
    FRAME_COUNT: 248,
    VIDEO_DURATION_MS: 9 * 1000
  },
  'black-hole': {
    FRAME_COUNT: 659,
    VIDEO_DURATION_MS: 21 * 1000
  }
}

const FRAME_COUNT = videoMetadata[DATA_SUBDIR].FRAME_COUNT
const VIDEO_DURATION_MS = videoMetadata[DATA_SUBDIR].VIDEO_DURATION_MS
const MAX_FRAME_INDEX = FRAME_COUNT - 1

// Generate file paths
const FILES = Array.from({ length: FRAME_COUNT })
// Not zero-indexed, so i + 1
const SAMPLE_VECTOR_FILES = FILES.map((_, i) => `${DATA_DIR}/mv/${i + 1}.json`)
const SAMPLE_FRAME_FILES = FILES.map((_, i) => `${DATA_DIR}/frames/frame${i + 1}.ppm`)

const PROCESS_JSON = async res => (await res.json()).filter(d => d.source === 1)
const PROCESS_PPM = async res => parsePPM(await res.arrayBuffer())

export function VectorField () {
  const vectorCanvas = useRef()
  const frameCanvas = useRef()
  const [currentFrame, setCurrentFrame] = useState(0)

  const { data: vectorData, isReady: isVectorsReady } = useBatchFetch(SAMPLE_VECTOR_FILES, PROCESS_JSON)
  const { data: frameData, isReady: isFramesReady } = useBatchFetch(SAMPLE_FRAME_FILES, PROCESS_PPM)
  const isReady = useMemo(() => isVectorsReady && isFramesReady, [isVectorsReady, isFramesReady])

  useEffect(() => {
    if (!isReady) return;
    timer(t => setCurrentFrame(t * MAX_FRAME_INDEX | 0), VIDEO_DURATION_MS)
  }, [isReady])

  // Max movement distance across all frames, so we can get a normalized magnitude.
  // Performance: don't take the sqrt when calculating distance
  const maxDistance = useMemo(() => (
    vectorData &&
      vectorData.flat().reduce(
        (max, { dx, dy }) => Math.max(max, dx * dx + dy * dy),
        0
      )
    ), [vectorData])

  // Reading width and height from a <canvas> causes reflow
  const [width, height] = useMemo(
    () => isReady ? [frameData[0].width, frameData[0].height] : [0, 0],
    [isReady, frameData]
  )

  useEffect(() => {
    if (!isReady) return;

    const frameCtx = frameCanvas.current.getContext('2d')
    frameCtx.putImageData(frameData[currentFrame], 0, 0)

    const vectorCtx = vectorCanvas.current.getContext('2d')
    if (IS_STACKED) {
      vectorCtx.clearRect(0, 0, width, height)
    } else {
      vectorCtx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      vectorCtx.fillRect(0, 0, width, height)
    }
    vectorCtx.strokeStyle = '#000'

    vectorData[currentFrame].forEach(d => {
      if (d.dx === 0 && d.dy === 0) return;

      const direction = Math.atan2(d.dst_y - d.src_y, d.dst_x - d.src_x)
      const magnitude = (d.dx * d.dx + d.dy * d.dy) / maxDistance
      const length = magnitude * Math.min(d.width, d.height)

      const nextPosition = [
        (WITH_ARROWS ? 0 : d.src_x) + length * Math.cos(direction),
        (WITH_ARROWS ? 0 : d.src_y) + length * Math.sin(direction)
      ]

      // Use the pixel color if we're not in debug mode
      if (!IS_DEBUG) {
        const color = Array.from(frameCtx.getImageData(d.src_x, d.src_y, 1, 1).data).slice(0, 3)
        vectorCtx.strokeStyle = `rgb(${color})`
      }

      if (WITH_ARROWS) {
        // const arrowSize = magnitude * 3
        const arrowSize = 5
        vectorCtx.translate(d.src_x + d.width / 2, d.src_y + d.height / 2)
        // FIXME Why Math.PI - ?
        vectorCtx.rotate(direction)
        vectorCtx.beginPath()
        vectorCtx.moveTo(0, 0)
        vectorCtx.lineTo(length, 0)
        vectorCtx.moveTo(length - arrowSize, -arrowSize)
        vectorCtx.lineTo(length, 0)
        vectorCtx.lineTo(length - arrowSize, arrowSize)
        vectorCtx.stroke()
        vectorCtx.setTransform(1, 0, 0, 1, 0, 0)
      } else {
        vectorCtx.beginPath()
        vectorCtx.moveTo(d.src_x, d.src_y)
        vectorCtx.lineTo(...nextPosition)
        vectorCtx.stroke()
      }

      if (IS_DEBUG) {
        vectorCtx.strokeStyle = 'red'
        vectorCtx.beginPath()
        vectorCtx.moveTo(d.src_x + 2, d.src_y)
        vectorCtx.lineTo(d.dst_x + 2, d.dst_y)
        vectorCtx.stroke()
      }
    })
  }, [currentFrame, isReady, vectorData, frameData, maxDistance, width, height])

  if (!isReady) {
    return <Spinner />
  }

  const frameNumberDisplay = (''+currentFrame).padStart((''+FRAME_COUNT).length, '0')

  return (
    <div>
      <span id="frame-counter">frame {frameNumberDisplay}</span>
      <br />
      <br />
      <div id="vis" className={IS_STACKED ? 'stacked' : ''}>
        <canvas ref={frameCanvas} id="source" width={width} height={height} />
        <canvas ref={vectorCanvas} id="motion" width={width} height={height} />
      </div>
    </div>
  )
}
