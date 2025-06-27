import chalk from "chalk"
import {EduarteAuth} from "./api/eduarte-auth";
import {EduarteAPI} from "./api/eduarte-api";

type colorType = "text" | "variable" | "error"

const themeColors = {
    text: "#d3e1e1",
    variable: "#4cacf1",
    error: "#f5426c"
}

export const getThemeColor = (color: colorType) => Number(`0x${themeColors[color].substring(1)}`)

export const getUnix = (date: Date) => Math.floor(date.getTime() / 1000);

export const validateTime = (timeString: string) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);

export const convertTimeToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const now = new Date();
    now.setHours(hours);
    now.setMinutes(minutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
};

export const stringToBoolean = (value: string) => {
    return value === 'true';
}

export const enumToArray = <T extends Record<string, any>>(input: T): Array<{ label: string; value: T[keyof T] }> => {
    return Object.keys(input)
        .filter(key => isNaN(Number(key)))
        .map(key => ({
            label: key,
            value: input[key as keyof T],
        }));
};


export const refreshCookie = async (auth: EduarteAuth, api: EduarteAPI) => {
    let authCookie;

    if (process.env.IS_MICROSOFT_LOGIN) {
        authCookie = await auth.loginMicrosoft(process.env.EDUARTE_EMAIL, process.env.EDUARTE_PASSWORD);
    } else {
        authCookie = await auth.loginEduarte(process.env.EDUARTE_EMAIL, process.env.EDUARTE_PASSWORD);
    }

    api.setAuthCookie(authCookie);
}

export const color = (color: colorType, message: any) => {
    return chalk.hex(themeColors[color])(message)
}