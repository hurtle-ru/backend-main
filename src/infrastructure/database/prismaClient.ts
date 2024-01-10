import { PrismaClient } from "@prisma/client";
import { hhTokenExtension } from "../../external/hh/auth/auth.prisma-extension";
import { applicantPrismaExtension } from "../../domain/applicant/applicant.prisma-extension";
import { employerPrismaExtension } from "../../domain/employer/employer.prisma-extension";
import { managerPrismaExtension } from "../../domain/manager/manager.prisma-extension";

export const prisma = new PrismaClient()
  .$extends(applicantPrismaExtension)
  .$extends(employerPrismaExtension)
  .$extends(managerPrismaExtension)
  .$extends(hhTokenExtension);