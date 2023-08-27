import * as self from "../index"
import { randomUUID } from "crypto"

export default class Session {
    constructor() { }

    async Create(tll_seconds: number = null) {
        let sid = randomUUID(),
            session_ids: Array<any> = await self.cache.get("stats_session_ids")
        if (typeof (session_ids) != "object") session_ids = []
        session_ids.push(sid)
        await self.cache.set("stats_session_ids", session_ids, tll_seconds != null ? tll_seconds * 1000 : undefined)
        return sid
    }
}