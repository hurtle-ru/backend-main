import { injectable, singleton } from "tsyringe";


@injectable()
@singleton()
export class ApplicantService {
  public readonly DEFAULT_SCALAR_SEARCH_FIELDS = [
    "firstName", "lastName", "middleName", "nickname", "login", "email", "phone",
  ]

  getApplicantSearchByDefaultSearchFields = (search: string | undefined, skillSearch: string[] | undefined,) => ({
    OR: [
      ...this.DEFAULT_SCALAR_SEARCH_FIELDS.map(fieldName => ({ [fieldName]: { search, mode: 'insensitive' } })),
      {
        resume: {
          title: search,
          summary: search,
          skills: { hasSome: skillSearch },
        }
      }
    ]
  })
}
