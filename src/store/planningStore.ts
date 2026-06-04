import { create } from 'zustand'
import type { MealSlot } from '../types'
import {
  getSlotsForWeek,
  upsertSlot,
  clearSlot,
} from '../db/planningQueries'
import { getWeekDays, getMondayOfWeek, addWeeks } from '../lib/dates'

interface PlanningStore {
  slots: MealSlot[]
  weekStart: Date
  isLoading: boolean
  loadWeek: (weekStart: Date) => Promise<void>
  nextWeek: () => Promise<void>
  prevWeek: () => Promise<void>
  goToToday: () => Promise<void>
  setSlot: (date: string, mealType: 'lunch' | 'dinner', recipeId: string) => Promise<void>
  removeSlot: (date: string, mealType: 'lunch' | 'dinner') => Promise<void>
}

export const usePlanningStore = create<PlanningStore>((set, get) => ({
  slots: [],
  weekStart: getMondayOfWeek(new Date()),
  isLoading: false,

  loadWeek: async (weekStart: Date) => {
    set({ isLoading: true, weekStart })
    const dates = getWeekDays(weekStart)
    const slots = await getSlotsForWeek(dates)
    set({ slots, isLoading: false })
  },

  nextWeek: async () => {
    const next = addWeeks(get().weekStart, 1)
    await get().loadWeek(next)
  },

  prevWeek: async () => {
    const prev = addWeeks(get().weekStart, -1)
    await get().loadWeek(prev)
  },

  goToToday: async () => {
    const monday = getMondayOfWeek(new Date())
    await get().loadWeek(monday)
  },

  setSlot: async (date, mealType, recipeId) => {
    const slot: MealSlot = {
      id: crypto.randomUUID(),
      date,
      meal_type: mealType,
      recipe_id: recipeId,
      servings_override: null,
      is_suggestion: false,
      is_leftover: false,
      validated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    await upsertSlot(slot)
    await get().loadWeek(get().weekStart)
  },

  removeSlot: async (date, mealType) => {
    await clearSlot(date, mealType)
    await get().loadWeek(get().weekStart)
  },
}))