import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error("SEED_ADMIN_EMAIL is required");
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin" },
    create: { email: adminEmail, name: "Admin", role: "admin" },
  });
  console.log(`✓ admin user: ${admin.email}`);

  const floor1 = await prisma.floor.upsert({
    where: { id: "seed-floor-1" },
    update: {},
    create: { id: "seed-floor-1", name: "Floor 1", displayOrder: 1 },
  });
  const floor2 = await prisma.floor.upsert({
    where: { id: "seed-floor-2" },
    update: {},
    create: { id: "seed-floor-2", name: "Floor 2", displayOrder: 2 },
  });
  console.log(`✓ floors: ${floor1.name}, ${floor2.name}`);

  const floor1Desks = ["1-A", "1-B", "1-C", "1-D", "1-E", "1-F"];
  const floor2Desks = ["2-A", "2-B", "2-C", "2-D"];

  for (const label of floor1Desks) {
    await prisma.desk.upsert({
      where: { floorId_label: { floorId: floor1.id, label } },
      update: {},
      create: {
        floorId: floor1.id,
        label,
        attributes: { monitor: true, standing: label.endsWith("A") },
      },
    });
  }
  for (const label of floor2Desks) {
    await prisma.desk.upsert({
      where: { floorId_label: { floorId: floor2.id, label } },
      update: {},
      create: {
        floorId: floor2.id,
        label,
        attributes: { monitor: label !== "2-D", accessible: label === "2-A" },
      },
    });
  }
  console.log(`✓ desks: ${floor1Desks.length + floor2Desks.length} total`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
