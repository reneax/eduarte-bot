import {parse as parseHtml} from "node-html-parser";
import {convertDate, formatDate} from "./utils";
import {Subject} from "./objects/subject";
import {SchoolDay} from "./objects/schoolDay";
import {AbsenceReason} from "./objects/absenceReason";
import {AbsenceStatus} from "./objects/absenceStatus";
import {AgendaView} from "./objects/agendaView";

class EduarteAPI {
    private readonly portalUrl: string;
    private readonly userAgent: string;
    private authCookie: string;
    private visitId: number | undefined;

    constructor(
        portalUrl: string,
        authCookie: string,
        userAgent: string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    ) {
        this.portalUrl = portalUrl.endsWith("/")
            ? portalUrl.substring(0, portalUrl.length - 1)
            : portalUrl;
        this.authCookie = authCookie;
        this.userAgent = userAgent;
    }

    async isSessionValid(): Promise<boolean> {
        let response = await fetch(this.portalUrl, {
            headers: this.getRequestHeaders(),
        });

        return response.url.includes(this.portalUrl);
    }

    setAuthCookie(authCookie: string) {
        this.authCookie = authCookie;
        this.visitId = undefined;
    }

    async setAgendaView(agendaView: AgendaView) {
        const visitId = await this.getVisitId();
        await this.requestPage(`${this.portalUrl}/agenda?${visitId}`);
        await fetch(`${this.portalUrl}/agenda?${visitId}-1.0-filter-weergaveKiezer-choicesContainer-enumHiddenField`, {
            method: 'POST',
            headers: this.getRequestHeaders({
                'accept': 'application/xml, text/xml, */*; q=0.01',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'wicket-ajax': 'true',
                'wicket-ajax-baseurl': 'agenda',
                'x-requested-with': 'XMLHttpRequest'
            }),
            body: new URLSearchParams({
                'filter:weergaveKiezer:choicesContainer:enumHiddenField': agendaView,
            })
        });
    }

    async getAgenda(): Promise<SchoolDay[]> {
        const visitId = await this.getVisitId();
        const page = await this.requestPage(`${this.portalUrl}/agenda?${visitId}`);
        const html = parseHtml(page);
        const schoolDays: SchoolDay[] = [];

        let agenda = html.querySelector(".agenda-list");

        if (!agenda) throw new Error("Agenda element has not been found. Is the agenda view not on list mode?");

        let tables = agenda.querySelectorAll("table");
        let titles = agenda.querySelectorAll(".agenda-title");

        if (tables.length === 0 || titles.length === 0) {
            throw new Error("The needed elements (tables & titles) are not found.");
        }

        titles.forEach((titleElement, index) => {
            let daySubjects: Subject[] = [];
            let tableElement = tables[index];
            let dateObject = convertDate(titleElement.textContent);
            let subjects = tableElement.querySelectorAll("tr");

            subjects.forEach((subjectElement) => {
                let details =
                    subjectElement.querySelector(".agenda-class")?.textContent || "";
                let startTimeString =
                    subjectElement.querySelector(".agenda-time .top")?.textContent || "";
                let endTimeString =
                    subjectElement.querySelector(".agenda-time .bottom")?.textContent ||
                    "";
                let [location, name, className, teacher] = details.split(" - ");
                let startTimeParsed = startTimeString
                    .split(":")
                    .map((value) => parseInt(value));
                let endTimeParsed = endTimeString
                    .split(":")
                    .map((value) => parseInt(value));

                let startTimeObject = new Date(dateObject);
                startTimeObject.setHours(startTimeParsed[0], startTimeParsed[1]);
                let endTimeObject = new Date(dateObject);
                endTimeObject.setHours(endTimeParsed[0], endTimeParsed[1]);
                let homework =
                    subjectElement.querySelector(".agenda-homework")?.textContent || "";
                let absenceStatus = (
                    subjectElement?.querySelector(".is-completed")
                        ? AbsenceStatus.PRESENT
                        : (subjectElement?.querySelector(".icon-absent-1") ?
                            AbsenceStatus.ABSENT : AbsenceStatus.NOT_REGISTERED)
                );

                let subjectJson: Subject = {
                    name,
                    location,
                    className,
                    startTimeString,
                    endTimeString,
                    startTimeObject,
                    endTimeObject,
                    teacher,
                    homework,
                    absenceStatus,
                };

                daySubjects.push(subjectJson);
            });

            let schoolDay: SchoolDay = {
                dateString: titleElement.textContent || "",
                dateObject,
                subjects: daySubjects,
            };

            schoolDays.push(schoolDay);
        });

        return schoolDays;
    }

    async reportAbsence(reason: AbsenceReason | number, startDate: Date, endDate: Date) {
        let startDateString = formatDate(startDate);
        let endDateString = formatDate(endDate);
        let startTimeString = startDate.getHours() + ":" + startDate.getMinutes();
        let endTimeString = endDate.getHours() + ":" + endDate.getMinutes();
        let visitId = await this.getVisitId();
        if (endDate < startDate) {
            throw new Error("End date cannot be before start date.");
        }

        // opening the page is required for some reason.
        let parsedHtml = parseHtml(await this.requestPage(`${this.portalUrl}/presentie/presentie.overzicht?${visitId}`));

        let buttonId = parsedHtml.querySelector(".header-toolbar--action")?.id;

        if (!buttonId) {
            throw new Error("Could not find button ID.");
        }

        let openFormResponse = await fetch(`${this.portalUrl}/presentie/presentie.overzicht?${visitId}-1.0-header-contextButtonPanel-leftContainer-leftButtons-0-link`, {
                method: 'GET',
                headers: this.getRequestHeaders({
                    'accept': 'application/xml, text/xml, */*; q=0.01',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'referer': `${this.portalUrl}/presentie/presentie.overzicht?${visitId}`,
                    'wicket-ajax': 'true',
                    'wicket-ajax-baseurl': 'presentie/presentie.overzicht',
                    'wicket-focusedelementid': buttonId,
                    'x-requested-with': 'XMLHttpRequest'
                })
            },
        );

        let formId = this.getFormId(await openFormResponse.text());

        if (!formId) {
            throw new Error("Could not get form ID.");
        }

        let saveFormResponse = await fetch(`${this.portalUrl}/presentie/presentie.overzicht?${visitId}-1.0-contextPopupPanel-opslaan`, {
            method: 'POST',
            headers: this.getRequestHeaders({
                'accept': 'application/xml, text/xml, */*; q=0.01',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'referer': `${this.portalUrl}/presentie/presentie.overzicht?${visitId}`,
                'wicket-ajax': 'true',
                'wicket-ajax-baseurl': `presentie/presentie.overzicht?${visitId}`,
                'wicket-focusedelementid': formId,
                'x-requested-with': 'XMLHttpRequest'
            }),
            body: new URLSearchParams({
                'absentiemelding:fieldSetMarkup:inputFields:0:controlGroup:controlGroup_body:formField': reason.toString(),
                'absentiemelding:fieldSetMarkup:inputFields:1:controlGroup:controlGroup_body:formField': startDateString,
                'absentiemelding:fieldSetMarkup:inputFields:2:controlGroup:controlGroup_body:formField': startTimeString,
                'absentiemelding:fieldSetMarkup:inputFields:3:controlGroup:controlGroup_body:formField': endDateString,
                'absentiemelding:fieldSetMarkup:inputFields:4:controlGroup:controlGroup_body:formField': endTimeString,
                'contextPopupPanel:opslaan': '1'
            })
        });

        let saveFormHtml = parseHtml(this.getHtmlFromXml(await saveFormResponse.text()));

        let errors = saveFormHtml.querySelectorAll(".form--errors")
            .map(error => error.querySelector("p")?.textContent)
            .filter(error => error);

        if (errors && errors.length > 0) {
            throw new Error(`Server responded with errors: ${errors}`)
        }
    }

    private getHtmlFromXml(xmlString: string): string {
        // this might break sometime, but we'll see.
        return xmlString.split("![CDATA[")[1].split("]]")[0];
    }

    private getFormId(xmlString: string): string | undefined {
        let parsedHtml = parseHtml(this.getHtmlFromXml(xmlString));
        return parsedHtml.querySelector("form")?.id;
    }

    private async getVisitId() {
        if (!this.visitId) {
            let response = await fetch(this.portalUrl, {
                headers: this.getRequestHeaders(),
            });

            if (!response.url.includes(this.portalUrl)) {
                throw new Error("Failed to get visit ID. Is the session valid?");
            }

            this.visitId = +response.url.replace(`${this.portalUrl}/?`, "");
        }

        this.visitId++;

        return this.visitId.toString();
    }

    private async requestPage(url: string): Promise<string> {
        const response = await fetch(url.toString(), {
            headers: this.getRequestHeaders({
                referer: this.portalUrl,
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page. Status: ${response.status}`);
        }

        return await response.text();
    }

    private getRequestHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
        return {
            "accept-language": "nl,en-US;q=0.9,en;q=0.8,nl-NL;q=0.7,af;q=0.6",
            cookie: this.authCookie,
            origin: this.portalUrl,
            "user-agent": this.userAgent,
            ...additionalHeaders,
        };
    }
}

export {EduarteAPI, SchoolDay, Subject};
