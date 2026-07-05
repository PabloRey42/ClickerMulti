import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface StarterLine {
  base: { name: string; type: "FIRE" | "WATER" | "GRASS"; baseAttack: number; baseHp: number };
  evolution: { name: string; baseAttack: number; baseHp: number };
  evolutionLevel: number;
}

const STARTER_LINES: StarterLine[] = [
  {
    base: { name: "Braisillon", type: "FIRE", baseAttack: 12, baseHp: 40 },
    evolution: { name: "Braisaur", baseAttack: 24, baseHp: 70 },
    evolutionLevel: 10,
  },
  {
    base: { name: "Aquapousse", type: "WATER", baseAttack: 11, baseHp: 45 },
    evolution: { name: "Aquadon", baseAttack: 22, baseHp: 78 },
    evolutionLevel: 10,
  },
  {
    base: { name: "Feuillite", type: "GRASS", baseAttack: 10, baseHp: 50 },
    evolution: { name: "Feuillorage", baseAttack: 21, baseHp: 85 },
    evolutionLevel: 10,
  },
];

async function main() {
  for (const line of STARTER_LINES) {
    const evolvedSpecies = await prisma.species.upsert({
      where: { name: line.evolution.name },
      update: {
        type: line.base.type,
        baseAttack: line.evolution.baseAttack,
        baseHp: line.evolution.baseHp,
      },
      create: {
        name: line.evolution.name,
        type: line.base.type,
        baseAttack: line.evolution.baseAttack,
        baseHp: line.evolution.baseHp,
      },
    });

    await prisma.species.upsert({
      where: { name: line.base.name },
      update: {
        type: line.base.type,
        baseAttack: line.base.baseAttack,
        baseHp: line.base.baseHp,
        evolutionLevel: line.evolutionLevel,
        evolvesToId: evolvedSpecies.id,
      },
      create: {
        name: line.base.name,
        type: line.base.type,
        baseAttack: line.base.baseAttack,
        baseHp: line.base.baseHp,
        evolutionLevel: line.evolutionLevel,
        evolvesToId: evolvedSpecies.id,
      },
    });
  }

  console.log(`Seeded ${STARTER_LINES.length} starter lines.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
