import { MeetingPayment, MeetingPaymentStatus, Prisma } from "@prisma/client";


export const meetingPaymentPrismaExtension = Prisma.defineExtension({
  model: {
    meetingPayment: {
      isExpired({ status, dueDate }: Pick<MeetingPayment, "status" | "dueDate">): boolean {
        return status !== "SUCCESS" && new Date() > dueDate;
      },
      hasUnexpired(payments: Pick<MeetingPayment, "status" | "dueDate">[]): boolean {
        return payments.some((p) => !Prisma.getExtensionContext(this).isExpired(p));
      },
      getPaidByGuest<T extends Pick<MeetingPayment, "status" | "guestEmail">>(
        payments: T[], guestEmail: string,
      ): T | undefined {
        return payments.filter((p) => p.status === MeetingPaymentStatus.SUCCESS && p.guestEmail === guestEmail)[0];
      },
    },
  },
});