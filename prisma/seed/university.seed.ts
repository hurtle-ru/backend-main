import * as fs from "fs";
import parser from "csv-parser";
import { PrismaClient } from ".prisma/client";


const loadData = async () => {
  const prisma = new PrismaClient();

  try {
    fs.createReadStream("./prisma/seed/universities.csv")
      .pipe(parser())
      .on("data", async (row: any) => {
        const university = {
          name: row.name,
        };

        await prisma.university.create({
          data: university,
        });
      })
      .on("end", () => {
        console.log("Success load base universities");
      })
      .on("error", (error: any) => {
        console.error("Error when load bas universities:", error);
      });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
};

loadData();