import { singleton } from "tsyringe";
import axios from "axios";
import { HttpError } from "../../../infrastructure/error/httpError";
import camelize from "../../../util/camelize";
import { GetMineResumeResponse } from "./resume.dto";
import { hh } from "../hh.dto";

@singleton()
export class HhResumeService {
  constructor() {
  }

  async getMine(accessToken: string): Promise<GetMineResumeResponse[]> {
    const response = await axios.get(`https://api.hh.ru/resumes/mine`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
    });

    if (response.status !== 200) throw new HttpError(401, "Invalid accessToken");

    return camelize(response.data.items) as GetMineResumeResponse[];
  }

  async getById(accessToken: string, id: string): Promise<hh.Resume> {
    const response = await axios.get(`https://api.hh.ru/resumes/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
    });

    if (response.status !== 200) throw new HttpError(401, "Invalid accessToken");

    return camelize(response.data);
  }
}
