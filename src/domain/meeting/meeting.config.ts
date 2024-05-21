import { MeetingType } from "@prisma/client";
import { GUEST_ROLE, UserRole } from "../auth/auth.dto";
import { bool, cleanEnv, port, str } from "envalid";


export const meetingConfig = cleanEnv(process.env, {
  MEETING_EXPORT_SECRET: str(),
});

export const ReminderMinutesBeforeMeeting = [
  60,
  24 * 60,
];

export const CreateSlotsWithinRangeMaximum = 50;

export type MeetingBusinessInfo = {
  name: string,
  description: string,
  reminder: string,
  roles: (keyof typeof UserRole | typeof GUEST_ROLE)[],
}

export type FreeMeetingBusinessInfo = MeetingBusinessInfo & {
  isFree: true,
}

export type PaidMeetingBusinessInfo = MeetingBusinessInfo & {
  isFree: false,
  priceInKopecks: number,
}

export type MeetingBusinessInfoByType = {
  [key in MeetingType]: FreeMeetingBusinessInfo | PaidMeetingBusinessInfo
};

export const MeetingBusinessInfoByTypes: MeetingBusinessInfoByType = {
  [MeetingType.CONSULTATION_B2C]: {
    name: "Консультация B2C",
    description: "",
    reminder: "",
    roles: [UserRole.APPLICANT],
    isFree: true,
  },
  [MeetingType.CONSULTATION_B2B]: {
    name: "Консультация B2B",
    description: "",
    reminder: "",
    roles: [UserRole.EMPLOYER],
    isFree: true,
  },
  [MeetingType.INTERVIEW]: {
    name: "Первое интервью",
    description:
      "На этой встрече пройдет вводное собеседование с HR-специалистом, чтобы создать твою карту компетенций, а также нейрорезюме.\n" +
      "Также, в процессе нашей беседы мы поможем тебе четко сформулировать ценность на рынке труда. " +
      "В конце встречи ты получишь обратную связь, которая поможет тебе расти и развиваться.",
    reminder: "Совсем скоро ты встретишься с менеджером Хартл и приблизишься к поиску работы своей мечты.",
    roles: [UserRole.APPLICANT],
    isFree: true,
  },
  [MeetingType.CONSULTATION_B2C_EXPERT]: {
    name: "Разбор резюме",
    description:
      "«Разбор резюме» поможет вам выделиться среди других кандидатов и привлечь внимание рекрутеров. \n" +
      "\n" +
      "Сначала мы немного побеседуем и структурируем ваш опыт работы, затем составим резюме, с которым вы уже сможете откликаться. А в завершении встречи, подготовим текстовое заключение. \n" +
      "\n" +
      "Идеально подходит для тех, кто постоянно откладывает поиск работы из-за несовершенного резюме, при этом упускает интересные вакансии или не получает приглашения на собеседования.",
    reminder: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    roles: [GUEST_ROLE],
    priceInKopecks: 1 * 100,
    isFree: false,
  },
  [MeetingType.CONSULTATION_B2C_EXPERT_2]: {
    name: "Разбор резюме",
    description:
      "«Разбор резюме» поможет вам выделиться среди других кандидатов и привлечь внимание рекрутеров. \n" +
      "\n" +
      "Сначала мы немного побеседуем и структурируем ваш опыт работы, затем составим резюме, с которым вы уже сможете откликаться. А в завершении встречи, подготовим текстовое заключение. \n" +
      "\n" +
      "Идеально подходит для тех, кто постоянно откладывает поиск работы из-за несовершенного резюме, при этом упускает интересные вакансии или не получает приглашения на собеседования.",
    reminder: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    roles: [GUEST_ROLE],
    priceInKopecks: 100 * 100,
    isFree: false,
  },
  [MeetingType.CONSULTATION_B2C_EXPERT_3]: {
    name: "Разбор резюме",
    description:
      "«Разбор резюме» поможет вам выделиться среди других кандидатов и привлечь внимание рекрутеров. \n" +
      "\n" +
      "Сначала мы немного побеседуем и структурируем ваш опыт работы, затем составим резюме, с которым вы уже сможете откликаться. А в завершении встречи, подготовим текстовое заключение. \n" +
      "\n" +
      "Идеально подходит для тех, кто постоянно откладывает поиск работы из-за несовершенного резюме, при этом упускает интересные вакансии или не получает приглашения на собеседования.",
    reminder: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    roles: [GUEST_ROLE],
    priceInKopecks: 350 * 100,
    isFree: false,
  },
};