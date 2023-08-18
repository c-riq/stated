export const timeSince = (t: Date):string => {
    const now: Date = new Date()
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;
    const dT: number = now.getTime() - t.getTime();
    if (dT < msPerMinute) return `${Math.floor(dT/1000)} second${Math.floor(dT/1000) > 1 ? 's' : ''} ago`
    if (dT < msPerHour) return `${Math.floor(dT/msPerMinute)} minute${Math.floor(dT/msPerMinute) > 1 ? 's' : ''} ago`
    if (dT < msPerDay ) return `${Math.floor(dT/msPerHour)} hour${Math.floor(dT/msPerHour) > 1 ? 's' : ''} ago`
    if (dT < msPerMonth) return `${Math.floor(dT/msPerDay)} day${Math.floor(dT/msPerDay) > 1 ? 's' : ''} ago`
    if (dT < msPerYear) return `${Math.floor(dT/msPerMonth)} month${Math.floor(dT/msPerMonth) > 1 ? 's' : ''} ago`
    return `${Math.floor(dT/msPerYear)} year${Math.floor(dT/msPerYear) > 1 ? 's' : ''} ago`   
}