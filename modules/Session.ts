import * as self from "../index"
import { randomUUID } from "crypto"

export default class Session {
    constructor() { }

    async Create(tll_seconds: number = null) {
        const sid = randomUUID()
        const session_ids: Array<any> = await self.cache.get("stats_session_ids")
        session_ids.push(sid)
        await self.cache.set("stats_session_ids", session_ids, tll_seconds * 1000)
        return sid
    }
}