import { Route, Get, Tags, Query, Security } from "tsoa";
import { prisma } from "../../../infrastructure/database/prismaClient";
import { UserRole } from "../../auth/auth.dto";
import { BasicResume, GetUniversitiesRequest } from "./university.dto"

@Route("universities")
@Tags("University")
export class UniversityController {
  @Get("")
  @Security("jwt", [UserRole.APPLICANT, UserRole.EMPLOYER, UserRole.MANAGER])
  async getUniversities(
    @Query() search: string,
): Promise<BasicResume[]> {
  GetUniversitiesRequest.schema.validateSync({search})

  const universities = await prisma.university.findMany({
    where: {
      name: { startsWith: search },
    },
    take: 5,
  });
  return universities;
  }
}