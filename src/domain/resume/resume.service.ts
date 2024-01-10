import { injectable, singleton } from "tsyringe";
import { HhToken } from "@prisma/client";
import { HhAuthService } from "../../external/hh/auth/auth.service";
import { HhResumeService } from "../../external/hh/resume/resume.service";

@injectable()
@singleton()
export class ResumeService {
  constructor(private readonly hhAuthService: HhAuthService,
              private readonly hhResumeService: HhResumeService,
  ) {}

  public async loadMine(hhToken: HhToken) {
    await this.hhAuthService.refreshTokenAndSaveIfNeed(hhToken);
    return await this.hhResumeService.getMine(hhToken.accessToken);
  }
}