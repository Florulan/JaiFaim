// Store Zustand — Planning
// Sera implémenté en Phase 3
import { create } from 'zustand'
import type { MealSlot } from '../types'

interface PlanningStore {
  slots: MealSlot[]
  isLoading: boolean
}

export const usePlanningStore = create<PlanningStore>(() => ({
  slots: [],
  isLoading: false,
}))
