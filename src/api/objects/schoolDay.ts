import {Subject} from "./subject";

interface SchoolDay {
    dateString: string;
    dateObject: Date;
    subjects: Subject[];
}

export {SchoolDay};
