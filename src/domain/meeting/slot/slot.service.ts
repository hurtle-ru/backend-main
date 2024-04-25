import { injectable, singleton } from "tsyringe";
import { MeetingType, Prisma } from "@prisma/client";
import { UserRole } from "../../auth/auth.dto";


@injectable()
@singleton()
export class MeetingSlotService {
  constructor() {}

  buildAccessWhereQuery(userRole: UserRole, userId: string, meetingSlotId: string): Prisma.MeetingSlotWhereUniqueInput {
    let where: Prisma.MeetingSlotWhereUniqueInput = { id: meetingSlotId };

    if (userRole === UserRole.EMPLOYER) {
      where = {
        ...where,
        OR: [
          { meeting: { employerId: userId } },
          { meeting: null },
        ],
      };
    } else if (userRole === UserRole.APPLICANT) {
      where = {
        ...where,
        OR: [
          { meeting: { applicantId: userId } },
          { meeting: null },
        ],
      };
    }

    return where;
  }
}
