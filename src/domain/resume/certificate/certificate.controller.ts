import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Put,
  Request,
  Res,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
  TsoaResponse,
} from "tsoa";
import { HttpError, HttpErrorBody } from "../../../infrastructure/error/http.error";
import { prisma } from "../../../infrastructure/database/prisma.provider";
import { JwtModel, UserRole } from "../../auth/auth.dto";
import {
  BasicResumeCertificate,
  CreateResumeCertificateRequest,
  CreateResumeCertificateRequestSchema,
  PatchResumeCertificateRequest,
  PatchResumeCertificateRequestSchema,
} from "./certificate.dto";


@Route("api/v1/resumeCertificates")
@Tags("Resume Certificate")
export class ResumeCertificateController extends Controller {
  @Post("")
  @Security("jwt", [UserRole.APPLICANT])
  @Response<HttpErrorBody>(404, "Resume not found")
  public async create(
    @Request() req: JwtModel,
    @Body() body: CreateResumeCertificateRequest,
  ): Promise<BasicResumeCertificate> {
    body = CreateResumeCertificateRequestSchema.validateSync(body);

    const resume = await prisma.resume.findUnique({
      where: { id: body.resumeId, applicantId: req.user.id },
    });

    if (!resume) throw new HttpError(404, "Resume not found");

    return prisma.resumeCertificate.create({
      data: {
        ...body,
      },
    });
  }

  @Patch("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeCertificate not found")
  public async patchById(
    @Request() req: JwtModel,
    @Path() id: string,
    @Body() body: PatchResumeCertificateRequest,
  ): Promise<void> {
    body = PatchResumeCertificateRequestSchema.validateSync(body);

    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const certificate = await prisma.resumeCertificate.findUnique({ where });
    if (!certificate) throw new HttpError(404, "ResumeCertificate not found");

    await prisma.resumeCertificate.update({
      where,
      data: body,
    });
  }

  @Delete("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeCertificate not found")
  public async deleteById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<void> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const certificate = await prisma.resumeCertificate.findUnique({ where });
    if (!certificate) throw new HttpError(404, "ResumeCertificate not found");

    await prisma.resumeCertificate.delete({ where });
  }

  @Get("{id}")
  @Security("jwt", [UserRole.APPLICANT, UserRole.MANAGER])
  @Response<HttpErrorBody>(404, "ResumeCertificate not found")
  public async getById(
    @Request() req: JwtModel,
    @Path() id: string,
  ): Promise<BasicResumeCertificate> {
    const where = {
      id,
      ...(req.user.role === UserRole.APPLICANT && { resume: { applicantId: req.user.id } }),
    };

    const certificate = await prisma.resumeCertificate.findUnique({ where });
    if (!certificate) throw new HttpError(404, "ResumeCertificate not found");

    return certificate;
  }
}
