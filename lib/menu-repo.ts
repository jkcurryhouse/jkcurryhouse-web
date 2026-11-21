import "server-only";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { menuItems as staticMenu, type MenuItem, type AllergenKey } from "@/lib/menu-data";
import type { MenuItem as DbMenuItem } from "@prisma/client";

/** Convert a database row into the shape the public site components use. */
export function toPublicItem(row: DbMenuItem): MenuItem {
  return {
    id:           row.id,
    name:         row.name,
    description:  row.description,
    price:        row.price,
    // A dish flagged as Today's Special is shown in the specials section
    category:     row.isSpecial ? "special" : (row.category.toLowerCase() as MenuItem["category"]),
    allergens:    row.allergens as AllergenKey[],
    isVegan:      row.isVegan,
    isVegetarian: row.isVegetarian,
    isSpicy:      row.isSpicy,
    chefPick:     row.chefPick,
    imageUrl:     row.imageUrl ?? undefined,
  };
}

/**
 * Menu for the public website: available dishes from the database.
 * Falls back to the bundled static menu only if the database can't be reached
 * (e.g. during a build without DB access), so the site never renders blank.
 */
export async function getPublicMenu(): Promise<{ items: MenuItem[]; source: "db" | "static" }> {
  try {
    const rows = await prisma.menuItem.findMany({
      where:   { isAvailable: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return { items: rows.map(toPublicItem), source: "db" };
  } catch (err) {
    console.error("[menu] database unavailable, serving static menu", err);
    return { items: staticMenu, source: "static" };
  }
}

/** Call after any admin change that affects what customers see. */
export function revalidatePublicMenu() {
  for (const p of ["/", "/menu", "/order"]) {
    try { revalidatePath(p); } catch { /* outside request scope */ }
  }
}
