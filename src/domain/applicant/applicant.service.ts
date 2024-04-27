import { injectable, singleton } from "tsyringe";


@injectable()
@singleton()
export class ApplicantService {
  public readonly DEFAULT_SCALAR_SEARCH_FIELDS = [
    "firstName", "lastName", "middleName", "nickname", "login", "email", "phone",
  ]

  getApplicantSearchByDefaultSearchFields = (search: string | undefined, availableResumesIds: string[]) => ({
    OR: [
      ...this.DEFAULT_SCALAR_SEARCH_FIELDS.map(fieldName => ({ [fieldName]: { search, mode: 'insensitive' } })),
      {
        resume: {
          id: { in: availableResumesIds || undefined},
          title: { search },
          summary: { search },
        }
      }
    ]
  })
}
