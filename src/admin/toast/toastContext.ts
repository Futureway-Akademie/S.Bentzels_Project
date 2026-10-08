import { createContext } from 'react'

export type ToastKind = 'success' | 'error'

export type ToastApi = {
  notify: (text: string, kind?: ToastKind) => void
}

export const ToastContext = createContext<ToastApi | null>(null)
