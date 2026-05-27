import { create } from 'zustand'
import type { Recipe, RecipeTag } from '../types'
import {
  createRecipe,
  updateRecipe as dbUpdateRecipe,
  deleteRecipe as dbDeleteRecipe,
  searchRecipes,
} from '../db/recipeQueries'

interface RecipeStore {
  recipes: Recipe[]
  isLoading: boolean
  searchQuery: string
  activeTag: RecipeTag | null
  loadRecipes: () => Promise<void>
  addRecipe: (recipe: Recipe) => Promise<void>
  updateRecipe: (recipe: Recipe) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  setSearchQuery: (q: string) => Promise<void>
  setActiveTag: (tag: RecipeTag | null) => Promise<void>
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  isLoading: false,
  searchQuery: '',
  activeTag: null,

  loadRecipes: async () => {
    set({ isLoading: true })
    const { searchQuery, activeTag } = get()
    let results = await searchRecipes(searchQuery)
    if (activeTag) {
      results = results.filter((r) => r.tags.includes(activeTag))
    }
    set({ recipes: results, isLoading: false })
  },

  addRecipe: async (recipe) => {
    await createRecipe(recipe)
    await get().loadRecipes()
  },

  updateRecipe: async (recipe) => {
    await dbUpdateRecipe(recipe)
    await get().loadRecipes()
  },

  deleteRecipe: async (id) => {
    await dbDeleteRecipe(id)
    await get().loadRecipes()
  },

  setSearchQuery: async (q) => {
    set({ searchQuery: q })
    await get().loadRecipes()
  },

  setActiveTag: async (tag) => {
    set({ activeTag: tag })
    await get().loadRecipes()
  },
}))