import * as fs from "fs";
import csvParser from "csv-parser";
import { PrismaClient } from ".prisma/client";

const prisma = new PrismaClient();
const TRANSACTION_BATCH_SIZE = 200; // To avoid Postgres 54000 error

const seedUniversities = async () => {
  const universities: { name: string }[] = [];

  try {
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream("./prisma/seed/universities.csv")
        .pipe(csvParser())
        .on("data", (data) => universities.push({ name: data.name }))
        .on("end", resolve)
        .on("error", reject);
    });

    for (let i = 0; i < universities.length; i += TRANSACTION_BATCH_SIZE) {
      const batch = universities.slice(i, i + TRANSACTION_BATCH_SIZE);

      await prisma.university.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    console.log("University data seeding completed or skipped if already seeded.");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seedUniversities();
