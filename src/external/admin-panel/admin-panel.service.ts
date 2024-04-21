import { singleton } from "tsyringe";


@singleton()
export class AdminPanelService {
    private ADMIN_PANEL_URL = "https://service.hurtle.ru/"

    public getLinkOnMeeting = (meetingId: string): string => this.ADMIN_PANEL_URL + "meetings/"  + meetingId
    public getLinkOnVacancy = (vacancyId: string): string => this.ADMIN_PANEL_URL + "vacancies/" + vacancyId
    public getLinkOnApplicant = (applicantId: string): string => this.ADMIN_PANEL_URL + "candidates/" + applicantId
    public getLinkOnEmployer = (employerId: string): string => this.ADMIN_PANEL_URL + "employers/" + employerId
}
