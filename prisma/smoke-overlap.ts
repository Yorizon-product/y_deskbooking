import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: "admin" } });
  const desk = await prisma.desk.findFirstOrThrow({ where: { active: true } });

  const start = new Date("2030-01-15T08:00:00Z");
  const end = new Date("2030-01-15T12:00:00Z");

  // clean any leftover from prior runs
  await prisma.booking.deleteMany({ where: { deskId: desk.id, startAt: start } });

  const a = await prisma.booking.create({
    data: { deskId: desk.id, userId: admin.id, slot: "morning", startAt: start, endAt: end },
  });
  console.log(`✓ created booking A: ${a.id}`);

  try {
    const b = await prisma.booking.create({
      data: { deskId: desk.id, userId: admin.id, slot: "morning", startAt: start, endAt: end },
    });
    console.error(`✗ SECOND booking was accepted! id=${b.id}. Constraint is broken.`);
    process.exit(1);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Booking_no_overlap") || msg.includes("exclusion")) {
      console.log(`✓ overlap rejected by DB: ${msg.split("\n")[0].slice(0, 120)}`);
    } else {
      console.error(`✗ rejected but with unexpected error: ${msg}`);
      process.exit(1);
    }
  }

  // cleanup
  await prisma.booking.deleteMany({ where: { deskId: desk.id, startAt: start } });
  console.log(`✓ smoke test passed — EXCLUDE constraint is live`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
