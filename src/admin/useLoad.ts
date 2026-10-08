import { useCallback, useEffect, useState } from 'react'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T }

/** Lädt Daten beim Öffnen. `load` muss stabil sein (Funktion außerhalb der Komponente oder useCallback). */
export function useLoad<T>(load: () => Promise<T>): {
  state: LoadState<T>
  reload: () => void
} {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    load()
      .then((data) => {
        if (active) setState({ status: 'ready', data })
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          })
      })
    return () => {
      active = false
    }
  }, [load, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, reload }
}
