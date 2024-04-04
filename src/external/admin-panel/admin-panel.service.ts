import { singleton } from "tsyringe";


@singleton()
export class AdminPanelService {
    private AdminPanelUrl = "https://service.hurtle.ru/"

    public getLinkOnMeeting = (meetingId: string): string => this.AdminPanelUrl + "meeting/"   + meetingId
    public getLinkOnVacancy = (vacancyId: string): string => this.AdminPanelUrl + "vacancies/" + vacancyId
}
