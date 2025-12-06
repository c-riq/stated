import { peopleCountBuckets } from './constants'

export const minPeopleCountToRange = (n: number): string | undefined => {
    if (n >= 10000000) return peopleCountBuckets["10000000"]
    if (n >= 1000000) return peopleCountBuckets["1000000"]
    if (n >= 100000) return peopleCountBuckets["100000"]
    if (n >= 10000) return peopleCountBuckets["10000"]
    if (n >= 1000) return peopleCountBuckets["1000"]
    if (n >= 100) return peopleCountBuckets["100"]
    if (n >= 10) return peopleCountBuckets["10"]
    if (n >= 0) return peopleCountBuckets["0"]
}

export const monthIndex = (month: string): number => 
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        .indexOf(month.toLowerCase().substr(0, 3))

export const birthDateFormat: RegExp = /(?<d>\d{1,2})\s(?<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?<y>\d{4})/