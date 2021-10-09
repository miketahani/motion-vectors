import React, { useMemo, useState, useEffect } from 'react'

const useBatchFetch = (files, handleFileAsync) => {
  const controller = useMemo(() => new AbortController(), [])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetches = files.map(async path => {
          const res = await fetch(path, { signal: controller.signal })
          return await handleFileAsync(res)
        })
        const fetched = await Promise.all(fetches)
        setIsFetching(false)
        setError(false)
        setData(fetched)
      } catch (e) {
        setIsFetching(false)
        setError(e)
        console.error(e)
      }
    }
    fetchData()

    return () => controller.abort()
  }, [controller, files, handleFileAsync])

  const isReady = useMemo(() => !isFetching && !error && !!data, [isFetching, error, data])

  return { isFetching, error, data, isReady }
}

export default useBatchFetch