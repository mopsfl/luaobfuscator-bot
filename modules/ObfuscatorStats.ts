import * as self from "../index"

export default class ObfuscatorStats {
    constructor(
        public file_cache_name = "obfuscator_stats",
    ) { }

    async Get(): Promise<Saved_Stats> {
        return await self.file_cache.get(this.file_cache_name)
    }

    async Set(stats: Saved_Stats) {
        return await self.file_cache.set(this.file_cache_name, stats)
    }

    async Update(today_stats: Obfuscator_Stats) {
        let current_stats: Saved_Stats = await this.Get(),
            current_date = self.utils.getFullDate()
        if (Object.values(current_stats).length <= 0) {
            const dates = self.chartImage.GetLocalizedDateStrings(8, true)
            dates.forEach(date => {
                current_stats[date] = {
                    total_obfuscations: today_stats.total_obfuscations,
                    total_file_uploads: today_stats.total_file_uploads,
                    time: new Date().getTime()
                }
            })
        }
        current_stats[current_date] = today_stats
        if (current_stats[current_date].total_file_uploads === undefined || current_stats[current_date].total_obfuscations === undefined) return
        return await this.Set(current_stats);
    }

    async ParseCurrentStat(name?: "total_file_uploads" | "total_obfuscations") {
        let current_stats = await this.Get(),
            req_stats = []

        Object.keys(current_stats).forEach(date => {
            const stat = current_stats[date]
            req_stats.push(stat[name])
        })
        req_stats.forEach((stat, index) => {
            let current_index = (req_stats.length - index) - 1,
                previous_index = (current_index - 1)

            if (previous_index <= -1) previous_index = 1
            if (req_stats[previous_index] > 0) req_stats[current_index] = (req_stats[current_index] - req_stats[previous_index])
        })
        return req_stats.slice(req_stats.length - 7);
    }
}

export interface Obfuscator_Stats {
    total_obfuscations: number
    total_file_uploads: number
    time: number
}

export interface Saved_Stats {
    [index: string]: Obfuscator_Stats
}