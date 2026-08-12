import { create } from 'zustand'

interface CaptureStore {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useCaptureStore = create<CaptureStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))