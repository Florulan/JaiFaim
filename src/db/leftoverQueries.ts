import { db } from './database'
import type { LeftoverItem } from '../types'

export async function getActiveLefotovers(): Promise<LeftoverItem[]> {
  return db.leftovers
    .where('frozen')
    .equals(0)
    .toArray()
}

export async function getFrozenLeftovers(): Promise<LeftoverItem[]> {
  return db.leftovers
    .where('frozen')
    .equals(1)
    .toArray()
}

export async function getAllLeftovers(): Promise<LeftoverItem[]> {
  return db.leftovers.orderBy('cooked_at').reverse().toArray()
}

export async function createLeftover(item: LeftoverItem): Promise<void> {
  await db.leftovers.add(item)
}

export async function updateLeftover(item: LeftoverItem): Promise<void> {
  await db.leftovers.put(item)
}

export async function deleteLeftover(id: string): Promise<void> {
  await db.leftovers.delete(id)
}

export async function consumeLeftoverPortion(id: string): Promise<void> {
  const item = await db.leftovers.get(id)
  if (!item) return
  if (item.portions <= 1) {
    await db.leftovers.delete(id)
  } else {
    await db.leftovers.update(id, { portions: item.portions - 1 })
  }
}