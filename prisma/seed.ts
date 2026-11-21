// Seeds the database with the launch menu from lib/menu-data.ts and default settings.
// Safe to re-run: existing dishes are left untouched (so admin edits are never overwritten).
//   npx prisma db seed
import { PrismaClient, type Category } from "@prisma/client";
import { menuItems } from "../lib/menu-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });

  let created = 0;
  for (let i = 0; i < menuItems.length; i++) {
    const m = menuItems[i];
    const exists = await prisma.menuItem.findUnique({ where: { id: m.id } });
    if (exists) continue;
    await prisma.menuItem.create({
      data: {
        id:           m.id,
        name:         m.name,
        description:  m.description,
        price:        m.price,
        category:     m.category.toUpperCase() as Category,
        isSpecial:    m.category === "special",
        isAvailable:  true,
        isVegan:      !!m.isVegan,
        isVegetarian: !!(m.isVegetarian || m.isVegan),
        isSpicy:      !!m.isSpicy,
        chefPick:     !!m.chefPick,
        sortOrder:    i,
        allergens:    m.allergens,
      },
    });
    created++;
  }
  console.log(`Seed complete: ${created} dish(es) added, ${menuItems.length - created} already present.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
