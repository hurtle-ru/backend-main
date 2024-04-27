import { injectable, singleton } from "tsyringe";
import { Prisma } from "@prisma/client";
import { DIGITS, ENGLISH_ALPHABET_LOWER, RUSSIAN_ALPHABET_LOWER } from "../../util/string.utils";
import _ from "lodash";


@injectable()
@singleton()
export class ApplicantService {
  public buildSearchInput(searchQuery: string): Prisma.ApplicantWhereInput {
    const searchWords = this.getSearchWords(searchQuery);

    const scalarFieldsInput = searchWords.flatMap((word): Prisma.ApplicantWhereInput[] => [
      { email: { contains: word, mode: "insensitive" } },
      { firstName: { contains: word, mode: "insensitive" } },
      { lastName: { contains: word, mode: "insensitive" } },
      { login: { contains: word, mode: "insensitive" } },
      { middleName: { contains: word, mode: "insensitive" } },
      { nickname: { contains: word, mode: "insensitive" } },
      { phone: { contains: word, mode: "insensitive" } },
    ]);

    const compositeFieldsInput = {
      resume: {
        OR: searchWords.flatMap((word): Prisma.ResumeWhereInput[] => [
          { title: { contains: word, mode: "insensitive" } },
          { summary: { contains: word, mode: "insensitive" } },
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
    searchQuery = this.prepareSearchQueryForFts(searchQuery);

    return {
      OR: [
        { email: { search: searchQuery, mode: "insensitive" } },
        { firstName: { search: searchQuery, mode: "insensitive" } },
        { lastName: { search: searchQuery, mode: "insensitive" } },
        { login: { search: searchQuery, mode: "insensitive" } },
        { middleName: { search: searchQuery, mode: "insensitive" } },
        { nickname: { search: searchQuery, mode: "insensitive" } },
        { phone: { search: searchQuery, mode: "insensitive" } },
        {
          resume: {
            OR: [
              { title: { search: searchQuery, mode: "insensitive" } },
              { summary: { search: searchQuery, mode: "insensitive" } },
            ],
          },
        },
      ],
    };
  }

  private getSearchWords(searchQuery: string): string[] {
    searchQuery = searchQuery
      .trim()
      .toLowerCase()
      .replaceAll("-", " ")
      .replace(/  +/g, " ")

    const allowedChars = ENGLISH_ALPHABET_LOWER + RUSSIAN_ALPHABET_LOWER + DIGITS + "@. ";
    searchQuery = _.filter(searchQuery, char => allowedChars.includes(char)).join("");

    return searchQuery
      .split(" ")
      .slice(0, 7);
  }

  private prepareSearchQueryForFts(searchQuery: string): string {
    return this.getSearchWords(searchQuery)
      .join(" | ");
  }
}
