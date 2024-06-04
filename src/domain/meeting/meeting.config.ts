import { MeetingType } from "@prisma/client";
import { GUEST_ROLE, UserRole } from "../auth/auth.dto";
import { cleanEnv, str } from "envalid";


export const meetingConfig = cleanEnv(process.env, {
  MEETING_EXPORT_SECRET: str(),
});

export const ReminderMinutesBeforeMeeting = [
  60,
  24 * 60,
];

export const CreateSlotsWithinRangeMaximum = 50;


export const BaseMeetingDescription = "На этой встрече пройдет вводное собеседование с HR-специалистом, чтобы создать твою карту компетенций, а также нейрорезюме."
+ "\nТакже, в процессе нашей беседы мы поможем тебе четко сформулировать ценность на рынке труда. "
+ "В конце встречи ты получишь обратную связь, которая поможет тебе расти и развиваться.";

export type MeetingBusinessInfo = {
  name: string,
  description: string,
  emailDescriptionOnCreate: string,
  emailDescriptionOnRemind: string,
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
    emailDescriptionOnCreate: "",
    emailDescriptionOnRemind: "",
    roles: [UserRole.APPLICANT],
    isFree: true,
  },
  [MeetingType.CONSULTATION_B2B]: {
    name: "Консультация B2B",
    description: "",
    emailDescriptionOnCreate: "",
    emailDescriptionOnRemind: "",
    roles: [UserRole.EMPLOYER],
    isFree: true,
  },
  [MeetingType.INTERVIEW]: {
    name: "Первое интервью",
    description:
      "На этой встрече пройдет вводное собеседование с HR-специалистом, чтобы создать твою карту компетенций, а также нейрорезюме.\n" +
      "Также, в процессе нашей беседы мы поможем тебе четко сформулировать ценность на рынке труда. " +
      "В конце встречи ты получишь обратную связь, которая поможет тебе расти и развиваться.",
    emailDescriptionOnCreate: "Совсем скоро ты встретишься с менеджером Хартл и приблизишься к поиску работы своей мечты.",
    emailDescriptionOnRemind: "Совсем скоро ты встретишься с менеджером Хартл и приблизишься к поиску работы своей мечты. Скорее лови своё подтверждение!",
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
    emailDescriptionOnCreate: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    emailDescriptionOnRemind: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    roles: [GUEST_ROLE],
    priceInKopecks: 1000 * 100,
    isFree: false,
  },
  [MeetingType.CONSULTATION_B2C_EXPERT_FOR_STUDENTS]: {
    name: "Разбор резюме",
    description:
      "«Разбор резюме» поможет вам выделиться среди других кандидатов и привлечь внимание рекрутеров. \n" +
      "\n" +
      "Сначала мы немного побеседуем и структурируем ваш опыт работы, затем составим резюме, с которым вы уже сможете откликаться. А в завершении встречи, подготовим текстовое заключение. \n" +
      "\n" +
      "Идеально подходит для тех, кто постоянно откладывает поиск работы из-за несовершенного резюме, при этом упускает интересные вакансии или не получает приглашения на собеседования.",
    emailDescriptionOnCreate: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    emailDescriptionOnRemind: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    roles: [GUEST_ROLE],
    priceInKopecks: 299 * 100,
    isFree: false,
  },
  [MeetingType.CONSULTATION_B2C_EXPERT_STANDARD]: {
    name: "Разбор резюме",
    description:
      "«Разбор резюме» поможет вам выделиться среди других кандидатов и привлечь внимание рекрутеров. \n" +
      "\n" +
      "Сначала мы немного побеседуем и структурируем ваш опыт работы, затем составим резюме, с которым вы уже сможете откликаться. А в завершении встречи, подготовим текстовое заключение. \n" +
      "\n" +
      "Идеально подходит для тех, кто постоянно откладывает поиск работы из-за несовершенного резюме, при этом упускает интересные вакансии или не получает приглашения на собеседования.",
    emailDescriptionOnCreate: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    emailDescriptionOnRemind: "Совсем скоро ты встретишься с нашим рекрутером и сделаешь своё резюме идеальным.",
    roles: [GUEST_ROLE],
    priceInKopecks: 599 * 100,
    isFree: false,
  },
};
