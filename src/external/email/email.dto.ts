

export const EMAIL_JOB_NAME = "sendEmail";
export const EMAIL_QUEUE_NAME = "emails";

export interface EmailJobData {
  to: string;
  subject: string;
  template: {
    name: string,
    context: {
      [key: string]: any
    },
  },
}