import { create } from 'zustand'
import type { ToastMessage, ToastType } from '../components/Toast'

interface ToastStore {
  toasts: ToastMessage[]
  addToast: (message: string, type: ToastType) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

// Helper utilisable en dehors des composants
export const toast = {
  success: (message: string) => {
    useToastStore.setState((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, type: 'success' as const }]
    }))
  },
  error: (message: string) => {
    useToastStore.setState((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, type: 'error' as const }]
    }))
  },
  info: (message: string) => {
    useToastStore.setState((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, type: 'info' as const }]
    }))
  },
}