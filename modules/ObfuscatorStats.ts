import Database from "./Database/Database"
import Utils from "./Utils"

export default {
    async Get(): Promise<Obfuscator_Stats[]> {
        try {
            const result = await Database.GetTable("obfuscator_stats")

            if (!result.success) {
                console.error("<Get->GetTable>[Obfuscator Stats Error]:", result.error.message)
                return []
            }

            return result.data
        } catch (error) {
            console.error(error)
        }
    },

    async Update(stats: Obfuscator_Stats) {
        try {
            if (stats.total_uploads === undefined || stats.total_obfuscations === undefined) return false

            await Database.GetTable("obfuscator_stats", null, true).then(async res => {
                if (!res.success) return console.error("<Update->GetTable>[Obfuscator Stats Error]:", res.error.message)
                const currentDate = Utils.ToLocalizedDateString(new Date(), true),
                    lastDate = res.data.date

                if (currentDate === lastDate) {
                    const updateResult = await Database.Update("obfuscator_stats", stats, { date: res.data.date })
                    if (!updateResult.success) return console.error("<Update->Update>[Obfuscator Stats Error]:", updateResult.error.message)
                } else {
                    const insertResult = await Database.Insert("obfuscator_stats", stats)
                    if (!insertResult.success) return console.error("<Update->Insert>[Obfuscator Stats Error]:", insertResult.error.message)
                }
            }).catch(console.error)

            return true
        } catch (error) {
            console.error(error)
        }
    },

    async Parse(limit = 7): Promise<number[]> {
        try {
            const result = await Database.GetTable("obfuscator_stats", null, false, limit + 1, true);

            if (!result.success) {
                console.error("<Parse->GetTable>[Obfuscator Stats Error]:", result.error.message);
                return [];
            }

            let data: number[] = result.data.map((d: Obfuscator_Stats) => d.total_obfuscations).reverse();

            data = data.map((value, index) => {
                const diff = value - (index > 0 ? data[index - 1] : 0);
                return diff > 0 ? diff : 0;
            });

            return data.slice(-limit);
        } catch (error) {
            console.error("[Parse Error]:", error);
            return [];
        }
    }
}

export interface Obfuscator_Stats {
    total_obfuscations: number
    total_uploads: number
    time: string | number,
    date: string,
}