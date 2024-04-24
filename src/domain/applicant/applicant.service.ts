import { injectable, singleton } from "tsyringe";


@injectable()
@singleton()
export class ApplicantService {
  public readonly DEFAULT_SCALAR_SEARCH_FIELDS = ["firstName", "lastName", "login", "nickname"]

  getApplicantSearchByDefaultSearchFields = (search: string | undefined) => ({
    OR: [
      ...this.DEFAULT_SCALAR_SEARCH_FIELDS.map(fieldName => ({ [fieldName]: { search } })),
      {
        resume: {
          OR: [
            { title: { search } },
            { skills: { has: search } },
          ]
        }
      }
    ]
  })
}
