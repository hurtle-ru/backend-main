import { injectable, singleton } from "tsyringe";
import {
  GetRecognizedResumeResponse,
  RawRecognizedResume,
  UnknownDeepRawRecognizedResume,
} from "./resume-ocr.dto";
import { ContactType, Currency } from "@prisma/client";


@injectable()
@singleton()
export class ResumeOcrMapper {
  constructor() {}

  // "Unknown deep" - довольный костыльный концепт, но работает стабильно
  public mapResume(unknownDeepRawResume: UnknownDeepRawRecognizedResume, jobId: string | null): GetRecognizedResumeResponse {
    const raw: RawRecognizedResume = this.findResumeData(unknownDeepRawResume)!;

    return {
      createdAt: new Date(),
      importedFrom: "PDF_USING_GPT",
      importedId: jobId,
      firstName: raw.firstName ?? "",
      middleName: raw.middleName ?? null,
      lastName: raw.lastName ?? "",
      birthDate: null,
      title: raw.title ?? "",
      summary: raw.summary ?? null,
      city: raw.city ?? null,
      country: raw.country ?? null,
      isReadyToRelocate: raw.isReadyToRelocate ?? null,
      skills: this.mapSkills(raw.skills),
      desiredSalary: raw.desiredSalary ?? null,
      desiredSalaryCurrency: this.mapDesiredSalaryCurrency(raw.desiredSalaryCurrency),
      certificates: this.mapCertificates(raw.certificates),
      contacts: this.mapContacts(raw.contacts),
      education: this.mapEducation(raw.education),
      experience: this.mapExperience(raw.experience),
      languages: this.mapLanguages(raw.languages),
    }
  }

  private mapSkills(skills: RawRecognizedResume["skills"]): GetRecognizedResumeResponse["skills"] {
    if(!skills) return [];
    const mappedSkills: GetRecognizedResumeResponse["skills"] = [];

    for (const skill of skills) {
      if(skill) mappedSkills.push(skill);
    }

    return mappedSkills;
  }

  private mapDesiredSalaryCurrency(desiredSalaryCurrency: RawRecognizedResume["desiredSalaryCurrency"]): Currency | null {
    if(desiredSalaryCurrency === null || desiredSalaryCurrency === undefined) return null;
    const upperDesiredSalaryCurrency = desiredSalaryCurrency.toUpperCase();

    if(upperDesiredSalaryCurrency as Currency & "RUR" === "RUR") return "RUB";
    if (!Object.values(Currency).includes(upperDesiredSalaryCurrency as keyof typeof Currency)) return null;

    return upperDesiredSalaryCurrency as Currency;
  }

  private mapCertificates(certificates: RawRecognizedResume["certificates"]): GetRecognizedResumeResponse["certificates"] {
    if (certificates === null || certificates === undefined) return [];
    const mappedCertificates: GetRecognizedResumeResponse["certificates"] = [];

    for(const certificate of certificates) {
      if(!certificate) continue;

      const mappedName = certificate.name ?? null;

      if(mappedName !== null) {
        mappedCertificates.push({
          name: mappedName,
          description: certificate.description ?? null,
          year: certificate.year ?? null,
        });
      }
    }

    return mappedCertificates;
  }

  private mapContacts(contacts: RawRecognizedResume["contacts"]): GetRecognizedResumeResponse["contacts"] {
    if(contacts === null || contacts === undefined) return [];
    const mappedContacts: GetRecognizedResumeResponse["contacts"] = [];

    for (let i = 0; i < contacts.length; i++){
      const contact = contacts[i];

      if(!contact) continue;

      const mappedName = null; // Игнорируем
      const mappedValue = contact.value ?? null;
      const mappedPreferred = false; // Игнорируем

      const rawType = contact.type ? contact.type.toUpperCase() : null;
      let mappedType = null;
      if(rawType) mappedType = Object.values(ContactType).includes(rawType as keyof typeof ContactType) ? rawType as ContactType : null;

      if(mappedType !== null && mappedValue !== null) {
        mappedContacts.push({
          name: mappedName,
          type: mappedType,
          value: mappedValue,
          preferred: mappedPreferred,
        });
      }
    }

    return mappedContacts;
  }

  private mapEducation(educationList: RawRecognizedResume["education"]): GetRecognizedResumeResponse["education"] {
    if (educationList === null || educationList === undefined) return [];
    const mappedEducation: GetRecognizedResumeResponse["education"] = [];

    for(const education of educationList) {
      if(!education) continue;

      const mappedName = education.name ?? null;

      if(mappedName !== null) {
        mappedEducation.push({
          name: mappedName,
          description: education.description ?? null,
          degree:  education.degree ?? null,
          startYear:  education.startYear ?? null,
          endYear:  education.endYear ?? null,
        });
      }
    }

    return mappedEducation
  }

  private mapExperience(experienceList: RawRecognizedResume["experience"]): GetRecognizedResumeResponse["experience"] {
    if (experienceList === null || experienceList === undefined) return [];
    const mappedExperience: GetRecognizedResumeResponse["experience"] = [];

    for(const experience of experienceList) {
      if(!experience) continue;

      const mappedPosition = experience.position ?? null;

      if(mappedPosition !== null) {
        mappedExperience.push({
          company: experience.company ?? null,
          position: mappedPosition,
          startMonth: experience.startMonth ?? null,
          startYear: experience.startYear ?? null,
          endMonth: experience.endMonth ?? null,
          endYear: experience.endYear ?? null,
          description: experience.description ?? null,
        });
      }
    }

    return mappedExperience
  }

  private mapLanguages(languages: RawRecognizedResume["languages"]): GetRecognizedResumeResponse["languages"] {
    if(languages === null || languages === undefined) return [];
    const mappedLanguages: GetRecognizedResumeResponse["languages"] = [];

    for (const language of languages) {
      if (!language) continue;

      const mappedName = language.name ?? null;
      let mappedLevel = null;
      if(language.level) {
        mappedLevel = language.level.toUpperCase();
        if(mappedLevel.includes("NAT")) mappedLevel = "L1";
      }

      if (mappedName !== null) {
        mappedLanguages.push({
          name: mappedName,
          level: mappedLevel,
        });
      }
    }

    return mappedLanguages;
  }

  private findResumeData(object: any): RawRecognizedResume | null {
    if (object !== null && typeof object === "object") {
      if (object.firstName !== undefined) {
        return object;
      }

      for (let i = 0; i < Object.keys(object).length; i++){
        const key: any = Object.keys(object)[i];
        const possibleResume = this.findResumeData(object[key]);
        if (possibleResume) return possibleResume;
      }
    }

    return null;
  }
}