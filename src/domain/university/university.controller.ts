import { Get, Query, Route, Security, Tags } from "tsoa";
import { prisma } from "../../infrastructure/database/prisma.provider";
import { UserRole } from "../auth/auth.dto";
import { BasicUniversity, GetAllUniversitiesRequestSearchSchema } from "./university.dto";

@Route("api/v1/universities")
@Tags("University")
export class UniversityController {
  /**
   * @param {string} search Минимальная длина: 3 символа
   */
  @Get("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  async getAll(
    @Query() search: string,
  ): Promise<BasicUniversity[]> {
    search = GetAllUniversitiesRequestSearchSchema.validateSync({ search });

    return prisma.university.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      take: 5,
    });
  }
}