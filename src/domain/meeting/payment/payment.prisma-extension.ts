import { MeetingPayment, Prisma } from "@prisma/client";


export const meetingPaymentPrismaExtension = Prisma.defineExtension({
  model: {
    meetingPayment: {
      isExpired({ status, dueDate }: Pick<MeetingPayment, "status" | "dueDate">): boolean {
        return status !== "SUCCESS" && new Date() > dueDate;
      },
      hasUnexpired(payments: Array<Pick<MeetingPayment, "status" | "dueDate">>): boolean {
        return payments.some(p => !Prisma.getExtensionContext(this).isExpired(p));
      },
    },
  },
});