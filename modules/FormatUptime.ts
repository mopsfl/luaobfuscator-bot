export default function (ms: number): string {
    let totalSeconds = (ms / 1000);
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);
    return `${days > 0 ? days + " days, " : ""}${hours > 0 ? hours + " hrs, " : ""}${minutes > 0 ? minutes + " mins, " : ""}${seconds} secs`
}