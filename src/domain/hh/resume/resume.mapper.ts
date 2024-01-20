import momentTimezone from "moment-timezone";
import moment from "moment";
import {
  ContactType, Currency,
  LanguageLevel,
  Resume,
  ResumeCertificate,
  ResumeContact,
  ResumeEducation,
  ResumeExperience,
  ResumeLanguage,
} from "@prisma/client";
import { hh } from "../../../external/hh/hh.dto";
import { injectable, singleton } from "tsyringe";


type MappedResume = Omit<Resume & {
  contacts: MappedContact[];
  languages: MappedLanguage[];
  experience: MappedExperience[];
  education: MappedEducation[];
  certificates: MappedCertificate[];
}, "id" | "applicantId" | "importedFrom" | "importedId">;

type MappedContact = Omit<ResumeContact, "resumeId" | "id">;
type MappedLanguage = Omit<ResumeLanguage, "resumeId" | "id">;
type MappedExperience = Omit<ResumeExperience, "resumeId" | "id">
type MappedEducation = Omit<ResumeEducation, "resumeId" | "id" | "startYear">
type MappedCertificate = Omit<ResumeCertificate, "resumeId" | "id">
type MappedDesiredSalary = {
  desiredSalary: number | null;
  desiredSalaryCurrency: MappedCurrency | null;
}
type MappedCurrency = Currency;

@injectable()
@singleton()
export class HhResumeMapper {
  constructor() {
  }

  mapResume(hhResume: hh.Resume): MappedResume {
    return {
      createdAt: momentTimezone(hhResume.createdAt, hh.DateTimeFormatWithTimeZone).toDate(),
      title: hhResume.title,
      city: hhResume.area?.name ?? null,
      skills: hhResume.skillSet,
      summary: hhResume.skills ?? null,
      ...this.mapDesiredSalary(hhResume.salary),
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

  mapDesiredSalary(hhSalary: hh.Salary): MappedDesiredSalary {
    return {
      desiredSalary: hhSalary.amount,
      desiredSalaryCurrency: this.mapCurrency(hhSalary.currency),
    }
  }

  mapCurrency(hhCurrency: hh.Currency): MappedCurrency | null {
    if(hhCurrency.code === "RUR") return "RUB";
    if (!Object.values(Currency).includes(hhCurrency.code as keyof typeof Currency)) return null;

    return hhCurrency.code as Currency;
  }

  mapContact(hhContact: hh.Contact): MappedContact {
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

  mapLanguage(hhLanguage: hh.Language): MappedLanguage {
    return {
      name: hhLanguage.name,
      level: LanguageLevel[hhLanguage.level.id.toUpperCase() as keyof typeof LanguageLevel],
    };
  }

  mapExperience(hhExperience: hh.Experience): MappedExperience {
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

  mapPrimaryEducation(hhPrimaryEducation: hh.PrimaryEducation, hhEducationLevel: hh.EducationLevel | null): MappedEducation {
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

  mapAdditionalEducation(hhAdditional: hh.CourseOrTest): MappedCertificate {
    const description = hhAdditional.organization + ", " + hhAdditional.result;

    return {
      name: hhAdditional.name,
      year: hhAdditional.year,
      description: description,
    };
  }

  mapAttestationEducation(hhAdditional: hh.CourseOrTest): MappedCertificate {
    const description = hhAdditional.organization + ", " + hhAdditional.result;

    return {
      name: hhAdditional.name,
      year: hhAdditional.year,
      description: description,
    };
  }
}