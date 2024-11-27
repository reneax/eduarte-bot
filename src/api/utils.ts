import {parse as parseDate} from "date-fns";

const dayNames: Record<string, string> = {
    "maandag": "Monday",
    "dinsdag": "Tuesday",
    "woensdag": "Wednesday",
    "donderdag": "Thursday",
    "vrijdag": "Friday",
    "zaterdag": "Saturday",
    "zondag": "Sunday",
};

const monthNames: Record<string, string> = {
    "januari": "January",
    "februari": "February",
    "maart": "March",
    "april": "April",
    "mei": "May",
    "juni": "June",
    "juli": "July",
    "augustus": "August",
    "september": "September",
    "oktober": "October",
    "november": "November",
    "december": "December",
};

function convertDate(dutchDate: string): Date {
    const [dutchDayName, day, dutchMonthName] = dutchDate.split(" ");

    const englishDayName = dayNames[dutchDayName];
    const englishMonthName = monthNames[dutchMonthName];

    const englishDateString = `${englishDayName} ${day} ${englishMonthName}`;
    return parseDate(englishDateString, "EEEE d MMMM", new Date());
}

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

export {convertDate, formatDate};
