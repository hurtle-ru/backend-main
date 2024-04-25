import * as yup from 'yup'
import { MappedResume } from './resume.mapper';
import { BasicResumeSchema } from '../../resume/resume.dto';
import { BasicResumeContactSchema } from '../../resume/contact/contact.dto';
import { BasicResumeEducationSchema } from '../../resume/education/education.dto';
import { BasicResumeLanguageSchema } from '../../resume/language/language.dto';
import { BasicResumeExperienceSchema } from '../../resume/experience/experience.dto';
import { BasicResumeCertificateSchema } from '../../resume/certificate/certificate.dto';


export type GetHhResumeSummaryResponse = {
  id: string;
  title?: string | null;
  createdAt: Date;
}

export const importedFromHhResumeSchema: yup.ObjectSchema<MappedResume> = BasicResumeSchema.pick([
  "createdAt",
  "title",
  "city",
  "skills",
  "summary",
  "desiredSalaryCurrency",
  "desiredSalary",
  "isVisibleToEmployers",
]).shape(
  {
    contacts: yup.array().of(BasicResumeContactSchema.pick([
      "name",
      "type",
      "value",
      "preferred",
    ])).defined(),
    languages: yup.array().of(BasicResumeLanguageSchema.pick([
      "name",
      "level",
    ])).defined(),
    experience: yup.array().of(BasicResumeExperienceSchema.pick([
      "position",
      "company",
      "description",
      "startMonth",
      "startYear",
      "endMonth",
      "endYear",
    ])).defined(),
    education: yup.array().of(BasicResumeEducationSchema.pick([
      "name",
      "endYear",
      "description",
      "degree",
    ])).defined(),
    certificates: yup.array().of(BasicResumeCertificateSchema.pick([
      "name",
      "description",
      "year",
    ])).defined(),
  }
)
