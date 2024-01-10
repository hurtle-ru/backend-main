

/* eslint-disable @typescript-eslint/no-namespace */
export namespace hh {
  export const DateTimeFormatWithTimeZone = "YYYY-MM-DDTHH:mm:ssZ";
  export const DateFormat = "YYYY-MM-DD";

  export interface ResumePreview {
    id: string;
    title: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
  }

  export interface Gender {
    id: string;
    name: string;
  }

  export interface Resume extends ResumePreview {
    createdAt: string; // @see DateTimeFormat
    area?: Area | null;
    skillSet: string[];
    skills?: string;
    contact: Contact[];
    language: Language[];
    totalExperience: { months: number };
    education: Education;
    experience: Experience[];
  }

  export interface Contact {
    comment?: string;
    preferred: boolean;
    type: { id: "home" | "work" | "cell" | "email" };
    id: string;
    name: string;
    value: string & {
      country: string;
      city: string;
      number: string;
      formatted: string;
    }
  }

  export interface Language {
    id: string;
    name: string;
    level: LanguageInfo;
  }

  export type LanguageInfo =
    | { id: "a1", name: "A1 — Начальный" }
    | { id: "a2", name: "A2 — Элементарный" }
    | { id: "b1", name: "B1 — Средний" }
    | { id: "b2", name: "B2 — Средне-продвинутый" }
    | { id: "c1", name: "C1 — Продвинутый" }
    | { id: "c2", name: "C2 — В совершенстве" }
    | { id: "l1", name: "Родной" }

  export interface Education {
    additional?: CourseOrTest[];
    attestation?: CourseOrTest[];
    elementary?: {
      name: string;
      year: number;
    };
    level?: EducationLevel;
    primary?: PrimaryEducation[];
  }

  export interface CourseOrTest {
    name: string;
    organization: string;
    result?: string;
    year: number;
  }

  export type EducationLevel =
    | { id: "secondary", name: "Среднее" }
    | { id: "special_secondary", name: "Среднее специальное" }
    | { id: "unfinished_higher", name: "Неоконченное высшее" }
    | { id: "higher", name: "Высшее" }
    | { id: "bachelor", name: "Бакалавр" }
    | { id: "master", name: "Магистр" }
    | { id: "candidate", name: "Кандидат наук" }
    | { id: "doctor", name: "Доктор наук" }


  export interface PrimaryEducation {
    name: string;
    name_id?: string;
    organization?: string;
    organization_id?: string;
    result?: string;
    result_id?: string;
    year: number;
  }

  export interface Experience {
    area: Area | null;
    company?: string;
    company_id?: string;
    company_url?: string;
    description?: string;
    employer?: Employer;
    industries: Industry[];
    industry?: Industry;
    position: string;
    start: string; // @see DateFormat
    end?: string; // @see DateFormat
  }

  export interface Area {
    id: string;
    name: string;
    url: string;
  }

  export interface Employer {
    alternate_url: string;
    id: string;
    logo_urls?: {
      90: string;
      240?: string;
      original: string;
    };
    name: string;
    url: string;
  }

  export interface Industry {
    id: string;
    name: string;
  }
}

