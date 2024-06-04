import { PrismaClient } from "@prisma/client";
import { hhTokenExtension } from "../../external/hh/auth/auth.prisma-extension";
import { applicantPrismaExtension } from "../../domain/applicant/applicant.prisma-extension";
import { employerPrismaExtension } from "../../domain/employer/employer.prisma-extension";
import { managerPrismaExtension } from "../../domain/manager/manager.prisma-extension";
import { meetingPrismaExtension } from "../../domain/meeting/meeting.prisma-extension";
import { existsExtension } from "./exists.prisma-extension";
import { meetingPaymentPrismaExtension } from "../../domain/meeting/payment/payment.prisma-extension";
import { resumePrismaExtension } from "../../domain/resume/resume.prisma-extension";


export const prisma = new PrismaClient()
  .$extends(applicantPrismaExtension)
  .$extends(employerPrismaExtension)
  .$extends(managerPrismaExtension)
  .$extends(meetingPrismaExtension)
  .$extends(hhTokenExtension)
  .$extends(existsExtension)
  .$extends(meetingPaymentPrismaExtension)
  .$extends(resumePrismaExtension);