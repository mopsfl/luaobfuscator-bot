export default function (ms: number): string {
    let totalSeconds = (ms / 1000);
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);

    const formatUnit = (value: number, singular: string, plural: string) => {
        return value > 0 ? `${value} ${value > 1 ? plural : singular}, ` : "";
    }

    return `${formatUnit(days, "day", "days")}${formatUnit(hours, "hr", "hrs")}${formatUnit(minutes, "min", "mins")}${seconds} ${seconds > 1 ? "secs" : "sec"}`;
}
