import momentTimezone from "moment-timezone";
import moment from "moment";
import {
  ContactType, Currency,
} from "@prisma/client";
import { hh } from "../../../external/hh/hh.dto";
import { injectable, singleton } from "tsyringe";
import {
  HhMappedResume,
} from "./resume.dto";


@injectable()
@singleton()
export class HhResumeMapper {
  constructor() {
  }

  mapResume(hhResume: hh.Resume): HhMappedResume {
    const desiredSalaryCurrency = hhResume.salary?.currency ? this.mapCurrency(hhResume.salary.currency) : null;
    const desiredSalary = hhResume.salary?.amount && desiredSalaryCurrency ? hhResume.salary.amount :  null;

    return {
      createdAt: momentTimezone(hhResume.createdAt, hh.DateTimeFormatWithTimeZone).toDate(),
      title: hhResume.title,
      city: hhResume.area?.name ?? null,
      skills: hhResume.skillSet,
      summary: hhResume.skills ?? null,
      desiredSalaryCurrency,
      desiredSalary,
      contacts: hhResume.contact.map(this.mapContact),
      languages: hhResume.language.map(this.mapLanguage),
      experience: hhResume.experience.map(this.mapExperience),
      education: hhResume.education.primary ? hhResume.education.primary.map(primary => {
        return this.mapPrimaryEducation(primary, hhResume.education.level ?? null);
      }) : [],
      certificates: [
        ...hhResume.education.additional ? hhResume.education.additional.map(this.mapAdditionalEducation) : [],
        ...hhResume.education.attestation ? hhResume.education.attestation.map(this.mapAttestationEducation) : [],
      ],
      isVisibleToEmployers: false,
    };
  }

  mapCurrency(hhCurrency: hh.Currency): Currency | null {
    if (hhCurrency === "RUR") return "RUB";
    if (!Object.values(Currency).includes(hhCurrency as keyof typeof Currency)) return null;

    return hhCurrency as Currency;
  }

  mapContact(hhContact: hh.Contact): HhMappedResume["contacts"][number] {
    let type: ContactType;
    switch (hhContact.type.id) {
    case "home":
      type = ContactType.PHONE;
      break;
    case "work":
      type = ContactType.PHONE;
      break;
    case "cell":
      type = ContactType.PHONE;
      break;
    case "email":
      type = ContactType.EMAIL;
      break;
    default:
      type = ContactType.OTHER;
      break;
    }

    let value: string;
    if (type === ContactType.PHONE) value = hhContact.value.country + hhContact.value.city + hhContact.value.number;
    else value = hhContact.value;

    return {
      type: type,
      name: hhContact.comment ?? null,
      preferred: hhContact.preferred,
      value: value,
    };
  }

  mapLanguage(hhLanguage: hh.Language): HhMappedResume["languages"][number] {
    return {
      name: hhLanguage.name,
      level: hhLanguage.level.id.toUpperCase(),
    };
  }

  mapExperience(hhExperience: hh.Experience): HhMappedResume["experience"][number] {
    return {
      position: hhExperience.position,
      company: hhExperience.company ?? null,
      description: hhExperience.description ?? null,
      startMonth: moment.utc(hhExperience.start, "YYYY-MM-DD").toDate().getMonth() + 1,
      startYear: moment.utc(hhExperience.start, "YYYY-MM-DD").toDate().getFullYear(),
      endMonth: hhExperience.end ? moment.utc(hhExperience.end, "YYYY-MM-DD").toDate().getMonth() + 1 : null,
      endYear: hhExperience.end ? moment.utc(hhExperience.end, "YYYY-MM-DD").toDate().getFullYear() : null,
    };
  }

  mapPrimaryEducation(hhPrimaryEducation: hh.PrimaryEducation, hhEducationLevel: hh.EducationLevel | null): HhMappedResume["education"][number] {
    let description = null;
    if (hhPrimaryEducation.organization && hhPrimaryEducation.result) description = hhPrimaryEducation.organization + ", " + hhPrimaryEducation.result;
    else if (hhPrimaryEducation.organization) description = hhPrimaryEducation.organization;
    else if (hhPrimaryEducation.result) description = hhPrimaryEducation.result;

    return {
      name: hhPrimaryEducation.name,
      endYear: hhPrimaryEducation.year,
      description: description,
      degree: hhEducationLevel?.name || null,
    };
  }

  mapAdditionalEducation(hhAdditional: hh.CourseOrTest): HhMappedResume["certificates"][number] {
    const description = hhAdditional.organization + ", " + hhAdditional.result;

    return {
      name: hhAdditional.name,
      year: hhAdditional.year,
      description: description,
    };
  }

  mapAttestationEducation(hhAdditional: hh.CourseOrTest): HhMappedResume["certificates"][number] {
    const description = hhAdditional.organization + ", " + hhAdditional.result;

    return {
      name: hhAdditional.name,
      year: hhAdditional.year,
      description: description,
    };
  }
}