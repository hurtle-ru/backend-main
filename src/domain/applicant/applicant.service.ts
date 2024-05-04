import { injectable, singleton } from "tsyringe";
import { Prisma } from "@prisma/client";
import SearchingUtils from "../../infrastructure/searching/utils";


@injectable()
@singleton()
export class ApplicantService {
  public buildSearchInput(searchQuery: string): Prisma.ApplicantWhereInput {
    const searchWords = SearchingUtils.getSearchWords(searchQuery);
    const mode = Prisma.QueryMode.insensitive

    const scalarFieldsInput = searchWords.flatMap((word): Prisma.ApplicantWhereInput[] => [
      { email: { contains: word, mode } },
      { firstName: { contains: word, mode } },
      { lastName: { contains: word, mode } },
      { login: { contains: word, mode } },
      { middleName: { contains: word, mode } },
      { nickname: { contains: word, mode } },
      { phone: { contains: word, mode } },
    ]);

    const compositeFieldsInput = {
      resume: {
        OR: searchWords.flatMap((word): Prisma.ResumeWhereInput[] => [
          { title: { contains: word, mode } },
          { summary: { contains: word, mode } },
        ]),
      },
    };

    return {
      OR: [
        ...scalarFieldsInput,
        compositeFieldsInput,
      ],
    };
  }

  public buildSearchInputWithFts(searchQuery: string): Prisma.ApplicantFindManyArgs["where"] {
    searchQuery = SearchingUtils.prepareSearchQueryForFts(searchQuery);
    const mode = Prisma.QueryMode.insensitive

    return {
      OR: [
        { email: { search: searchQuery, mode } },
        { firstName: { search: searchQuery, mode } },
        { lastName: { search: searchQuery, mode } },
        { login: { search: searchQuery, mode } },
        { middleName: { search: searchQuery, mode } },
        { nickname: { search: searchQuery, mode } },
        { phone: { search: searchQuery, mode } },
        {
          resume: {
            OR: [
              { title: { search: searchQuery, mode } },
              { summary: { search: searchQuery, mode } },
            ],
          },
        },
      ],
    };
  }
}
