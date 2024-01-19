import { Get, Query, Route, Security, Tags } from "tsoa";
import { prisma } from "../../../infrastructure/database/prismaClient";
import { UserRole } from "../../auth/auth.dto";
import { BasicUniversity, GetAllUniversitiesRequest } from "./university.dto";

@Route("universities")
@Tags("University")
export class UniversityController {
  @Get("")
  @Security("jwt", [UserRole.APPLICANT])
  async getAll(
    @Query() search: string,
): Promise<BasicUniversity[]> {
    GetAllUniversitiesRequest.schema.validateSync({ search });

    return prisma.university.findMany({
      where: {
        name: { startsWith: search },
      },
      take: 5,
    });
  }
}