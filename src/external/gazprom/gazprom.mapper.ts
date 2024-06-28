import { injectable, singleton } from "tsyringe";
import { GazpromUserInfo, GazpromUserInfoResponse,} from "./gazprom.dto";
import { Gender } from "@prisma/client";


@singleton()
@injectable()
export class GazpromMappingService {
  mapUserInfo(data: GazpromUserInfoResponse): GazpromUserInfo {
    return {
      openid: data.openid,
      phone: data.phone ?? null,
      nickname: data.nickname ?? null,
      city: data.city ?? null,
      gender: this.mapGender(data.gender),
      age: data.age ?? null,
      email: data.email ?? null,
      firstName: data.first_name ?? null,
      lastName: data.last_name ?? null,
      birthDate: data.birthdate ?? null,
      middleName: this.parseMiddleName(data.profile),
    }
  }

  private parseMiddleName(profile?: string): string | null {
    if (!profile) return null
    if (profile.split(" ").length !== 3) return null

    return profile.split(" ")[2]
  }

  private mapGender(gender?: string) {
    if (gender === "m") return Gender.MALE
    if (gender === "f") return Gender.FEMALE

    return null
  }
}
