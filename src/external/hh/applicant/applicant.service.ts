import { singleton } from "tsyringe";
import axios from "axios";
import { HttpError } from "../../../infrastructure/error/httpError";
import camelize from "../../../util/camelize";
import { BasicApplicant, ExtendedApplicant } from "./applicant.dto";
import { HhResumeService } from "../resume/resume.service";


@singleton()
export class HhApplicantService {
  constructor(private readonly hhResumeService: HhResumeService) {
  }

  async getMeApplicant(accessToken: string): Promise<BasicApplicant> {
    const response = await axios.get("https://api.hh.ru/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
    });
    const data = camelize(response.data);

    if(response.status !== 200) throw new Error("Invalid hh.ru accessToken or service is unavailable");
    if(!data.isApplicant) throw new HttpError(403, "hh.ru user is not applicant");

    return data;
  }

  async getMeExtendedApplicant(accessToken: string): Promise<ExtendedApplicant> {
    const applicant = await this.getMeApplicant(accessToken);
    const extendedApplicant: ExtendedApplicant = {
      ...applicant,
      gender: null,
      birthDate: null,
    };

    const response = await this.hhResumeService.getMine(accessToken)
    response.forEach((resume) => {
      extendedApplicant.birthDate = resume.birthDate ?? extendedApplicant.birthDate
      extendedApplicant.gender = resume.gender ?? extendedApplicant.gender
    });

    return extendedApplicant;
  }
}
