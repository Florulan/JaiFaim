import type { Recipe } from '../types'
import {
  SYSTEM_PROMPT_BASE,
  PROMPT_PAR_NOM,
  PROMPT_PAR_INGREDIENT,
  PROMPT_PAR_DESCRIPTION,
} from './prompts'

export type SaisieMode = 'nom' | 'ingredient' | 'description'

const API_KEY_STORAGE_KEY = 'anthropic_api_key'

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key)
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY)
}

function buildUserPrompt(input: string, mode: SaisieMode): string {
  switch (mode) {
    case 'nom':
      return PROMPT_PAR_NOM(input)
    case 'ingredient':
      return PROMPT_PAR_INGREDIENT(input)
    case 'description':
      return PROMPT_PAR_DESCRIPTION(input)
  }
}

export async function generateRecipe(
  input: string,
  mode: SaisieMode
): Promise<Omit<Recipe, 'id' | 'created_at' | 'updated_at'>> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('Cle API manquante. Configure-la dans les parametres.')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      system: SYSTEM_PROMPT_BASE,
      messages: [
        { role: 'user', content: buildUserPrompt(input, mode) },
      ],
    }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Cle API invalide. Verifie dans les parametres.')
    }
    throw new Error('Erreur API : ' + response.status)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''

  try {
    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const parsed = JSON.parse(clean)
    return {
      name: parsed.name ?? 'Recette sans nom',
      emoji: parsed.emoji ?? '🍽️',
      photo_url: null,
      prep_time: Number(parsed.prep_time) || 15,
      cook_time: Number(parsed.cook_time) || 20,
      servings: Number(parsed.servings) || 2,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      macros: {
        kcal: Number(parsed.macros?.kcal) || 0,
        p: Number(parsed.macros?.p) || 0,
        g: Number(parsed.macros?.g) || 0,
        l: Number(parsed.macros?.l) || 0,
        confidence: parsed.macros?.confidence ?? 'low',
      },
      notes: parsed.notes ?? null,
    }
  } catch {
    throw new Error('Reponse IA invalide. Reessaie.')
  }
}