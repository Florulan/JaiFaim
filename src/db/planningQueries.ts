import { db } from './database'
import type { MealSlot } from '../types'

export async function getSlotsForWeek(dates: string[]): Promise<MealSlot[]> {
  return db.meal_slots
    .where('date')
    .anyOf(dates)
    .toArray()
}

export async function getSlot(date: string, mealType: 'lunch' | 'dinner'): Promise<MealSlot | undefined> {
  return db.meal_slots
    .where('[date+meal_type]')
    .equals([date, mealType])
    .first()
}

export async function upsertSlot(slot: MealSlot): Promise<void> {
  const existing = await getSlot(slot.date, slot.meal_type)
  if (existing) {
    await db.meal_slots.update(existing.id, slot)
  } else {
    await db.meal_slots.add(slot)
  }
}

export async function clearSlot(date: string, mealType: 'lunch' | 'dinner'): Promise<void> {
  const existing = await getSlot(date, mealType)
  if (existing) {
    await db.meal_slots.delete(existing.id)
  }
}

export async function getSlotsWithRecipe(recipeId: string): Promise<MealSlot[]> {
  return db.meal_slots
    .where('recipe_id')
    .equals(recipeId)
    .toArray()
}