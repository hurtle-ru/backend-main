import { MeetingPayment, MeetingPaymentStatus, Prisma } from "@prisma/client";


export const meetingPaymentPrismaExtension = Prisma.defineExtension({
  model: {
    meetingPayment: {
      isPendingExpired({ status, dueDate }: Pick<MeetingPayment, "status" | "dueDate">): boolean {
        return status === "PENDING" && new Date() > dueDate;
      },
      hasPendingUnexpired(payments: Pick<MeetingPayment, "status" | "dueDate">[]): boolean {
        return payments.some((p) =>
          p.status === "PENDING" && !Prisma.getExtensionContext(this).isPendingExpired(p),
        );
      },
      getPaidByGuest<T extends Pick<MeetingPayment, "status" | "guestEmail">>(
        payments: T[], guestEmail: string,
      ): T | undefined {
        return payments.filter((p) => p.status === MeetingPaymentStatus.SUCCESS && p.guestEmail === guestEmail)[0];
      },
    },
  },
});