import {AbsenceStatus} from "./absenceStatus";

interface Subject {
    name?: string
    location?: string;
    className?: string
    startTimeString?: string;
    endTimeString?: string;
    startTimeObject?: Date;
    endTimeObject?: Date;
    teacher?: string;
    homework?: string;
    absenceStatus: AbsenceStatus;
}

export {Subject};
