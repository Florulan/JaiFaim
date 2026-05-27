// Store Zustand — Recettes
// Sera implémenté en Phase 1
import { create } from 'zustand'
import type { Recipe } from '../types'

interface RecipeStore {
  recipes: Recipe[]
  isLoading: boolean
}

export const useRecipeStore = create<RecipeStore>(() => ({
  recipes: [],
  isLoading: false,
}))
