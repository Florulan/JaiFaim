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

export interface PlanningAIRequest {
  recipes: Recipe[]
  macrosTarget: { kcal: number; p: number; g: number; l: number }
  daysToFill: { date: string; mealType: 'lunch' | 'dinner' }[]
  alreadyPlanned: { date: string; mealType: 'lunch' | 'dinner'; recipeName: string; macros: { kcal: number; p: number; g: number; l: number } }[]
  noRepeatDays: number
}

export interface PlanningAIResult {
  date: string
  mealType: 'lunch' | 'dinner'
  recipeId: string
  reason: string
}

export async function generatePlanningWithAI(request: PlanningAIRequest): Promise<PlanningAIResult[]> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('Clé API manquante. Configure-la dans les paramètres.')

  const { recipes, macrosTarget, daysToFill, alreadyPlanned, noRepeatDays } = request

  const recipesSummary = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    tags: r.tags,
    kcal: r.macros.kcal,
    p: r.macros.p,
    g: r.macros.g,
    l: r.macros.l,
  }))

  const systemPrompt = `Tu es un expert en nutrition et planification de repas. Tu génères des suggestions de repas équilibrées en JSON.
Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans backticks, sans texte avant ou après.
Format : [{ "date": "YYYY-MM-DD", "mealType": "lunch"|"dinner", "recipeId": "uuid", "reason": "string court" }]`

  const userPrompt = `Objectifs macros QUOTIDIENS de l'utilisateur :
- Calories : ${macrosTarget.kcal} kcal
- Protéines : ${macrosTarget.p}g
- Glucides : ${macrosTarget.g}g
- Lipides : ${macrosTarget.l}g

Repas déjà planifiés cette semaine (ne pas dépasser les macros avec ces repas inclus) :
${alreadyPlanned.length === 0 ? 'Aucun' : alreadyPlanned.map((s) => `- ${s.date} ${s.mealType}: ${s.recipeName} (${s.macros.kcal} kcal, ${s.macros.p}g prot)`).join('\n')}

Repas à planifier :
${daysToFill.map((s) => `- ${s.date} ${s.mealType}`).join('\n')}

Recettes disponibles :
${JSON.stringify(recipesSummary, null, 2)}

Règles IMPORTANTES :
1. Ne pas répéter une recette déjà utilisée dans les ${noRepeatDays} derniers jours
2. Si des repas déjà planifiés sont riches en graisses (tartiflette, gratin, etc.), compenser avec des repas plus légers et protéinés
3. Alterner les types de cuisine et de protéines
4. Favoriser les recettes "rapide" en semaine (lundi-vendredi), "elabore" le week-end
5. Équilibrer les macros sur la journée entre lunch et dinner
6. La raison doit expliquer brièvement pourquoi ce choix (ex: "Léger pour compenser le gratin de hier")

Génère une suggestion pour chaque repas à planifier.`

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
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('Clé API invalide.')
    throw new Error('Erreur API : ' + response.status)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text ?? ''

  try {
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(clean) as PlanningAIResult[]
  } catch {
    throw new Error('Réponse IA invalide. Réessaie.')
  }
}