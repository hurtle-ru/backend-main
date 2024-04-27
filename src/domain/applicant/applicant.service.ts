import { injectable, singleton } from "tsyringe";
import { Prisma } from "@prisma/client";


@injectable()
@singleton()
export class ApplicantService {
  public static readonly DEFAULT_SCALAR_SEARCH_FIELDS = [
    "firstName",
    "lastName",
    "middleName",
    "nickname",
    "login",
    "email",
    "phone",
  ];

  public getApplicantSearchByDefaultSearchFields(search: string): Prisma.ApplicantFindManyArgs["where"] {
    return {
      OR: [
        ...ApplicantService.DEFAULT_SCALAR_SEARCH_FIELDS.map(fieldName => ({
            [fieldName]: {
              search,
              mode: "insensitive",
            },
          })
        ), {
          resume: {
            title: {
              search,
              mode: "insensitive",
            },
            summary: {
              search,
              mode: "insensitive",
            },
          },
        },
      ],
    };
  }
}
