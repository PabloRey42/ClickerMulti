import { PrismaClient } from "@prisma/client";
import { GENERATOR_COST_GROWTH_DEFAULT } from "@farm-clicker/shared";

const prisma = new PrismaClient();

interface GeneratorSeed {
  key: string;
  name: string;
  baseCost: bigint;
  baseProduction: bigint;
  sortOrder: number;
}

const GENERATORS: GeneratorSeed[] = [
  { key: "poussin", name: "Poussin", baseCost: 15n, baseProduction: 1n, sortOrder: 0 },
  { key: "lapin", name: "Lapin angora", baseCost: 100n, baseProduction: 5n, sortOrder: 1 },
  { key: "vache", name: "Vache laitière", baseCost: 1_100n, baseProduction: 40n, sortOrder: 2 },
  { key: "ruche", name: "Ruche magique", baseCost: 12_000n, baseProduction: 260n, sortOrder: 3 },
  {
    key: "dragon-jardin",
    name: "Dragonnet des vergers",
    baseCost: 130_000n,
    baseProduction: 1_400n,
    sortOrder: 4,
  },
];

async function main() {
  for (const generator of GENERATORS) {
    await prisma.generator.upsert({
      where: { key: generator.key },
      update: {
        name: generator.name,
        baseCost: generator.baseCost,
        costGrowth: GENERATOR_COST_GROWTH_DEFAULT,
        baseProduction: generator.baseProduction,
        sortOrder: generator.sortOrder,
      },
      create: {
        key: generator.key,
        name: generator.name,
        baseCost: generator.baseCost,
        costGrowth: GENERATOR_COST_GROWTH_DEFAULT,
        baseProduction: generator.baseProduction,
        sortOrder: generator.sortOrder,
      },
    });
  }

  console.log(`Seeded ${GENERATORS.length} generators.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
