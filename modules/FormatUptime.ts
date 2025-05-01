export default function (ms: number, relative = false): string {
    if (!relative) {
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
    } else {
        const units = [
            { label: 'year', ms: 31536000000 },
            { label: 'month', ms: 2592000000 },
            { label: 'week', ms: 604800000 },
            { label: 'day', ms: 86400000 },
            { label: 'hour', ms: 3600000 },
            { label: 'minute', ms: 60000 },
            { label: 'second', ms: 1000 },
        ];

        let remaining = ms;
        const result: string[] = [];

        for (const unit of units) {
            const count = Math.floor(remaining / unit.ms);
            if (count > 0) {
                result.push(`${count} ${unit.label}${count > 1 ? 's' : ''}`);
                remaining -= count * unit.ms;
            }
            if (result.length === 2) break;
        }

        if (result.length === 0) return '0 seconds';
        return result.join(' ');
    }
}
