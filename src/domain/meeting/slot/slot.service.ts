import { injectable, singleton } from "tsyringe";
import { MeetingType } from "@prisma/client";
import { UserRole } from "../../auth/auth.dto";
import { UtcDate } from "../../../infrastructure/controller/date/date.dto";


@injectable()
@singleton()
export class MeetingSlotService {
  constructor() {}

  /**
   * Создает объект диапазона дат UTC для Prisma, охватывающий весь 1 день.
   * @param {UtcDate} dateString - Дата (строка), для которой создается Prisma диапазон дат от начала и до конца дня.
   * @returns Объект со свойствами "gte" (начало дня) и "lte" (конец дня), оба свойства имеют тип Date.
   */
  createFullDayUtcDateRange(dateString: UtcDate): { gte: Date; lte: Date } {
    const dateObject = {
      day: Number(dateString.split("/")[0]),
      month: Number(dateString.split("/")[1]),
      year: Number(dateString.split("/")[2]),
    };

    const startOfDayUTC = new Date(Date.UTC(dateObject.year, dateObject.month - 1, dateObject.day, 0, 0, 0));
    const endOfDayUTC = new Date(Date.UTC(dateObject.year, dateObject.month - 1, dateObject.day, 23, 59, 59, 999));

    return {
      gte: startOfDayUTC,
      lte: endOfDayUTC,
    };
  }

  getSlotTypesByUserRole(userRole: UserRole): MeetingType[] {
    if(userRole === UserRole.APPLICANT) return [MeetingType.CONSULTATION_B2C, MeetingType.INTERVIEW];
    else if(userRole === UserRole.EMPLOYER) return [MeetingType.CONSULTATION_B2B];
    else throw new Error("Unknown user role");
  }
}
