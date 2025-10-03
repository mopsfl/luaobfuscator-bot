import { User } from "discord.js"
import { cache } from "../../index"
import { randomUUID } from "crypto"

export default {
    async Create(tll_seconds: number = null) {
        let sid = randomUUID(),
            session_ids: Array<any> = await cache.get("stats_session_ids")
        if (typeof (session_ids) != "object") session_ids = []
        session_ids.push(sid)
        await cache.set("stats_session_ids", session_ids, tll_seconds != null ? tll_seconds * 1000 : undefined)
        return sid
    },

    async CreateV2(ttl?: number, user?: User): Promise<Session> {
        const session: Session = {
            userId: user.id,
            username: user.username,
            session: randomUUID(),
            created: Date.now(),
            expires: ttl ? Date.now() + ttl * 1000 : undefined
        }

        await cache.set(session.session, session, ttl * 1000)
        return session
    },

    async Get(sessionId: string): Promise<Session> {
        return await cache.get(sessionId)
    }
}

export type Session = {
    userId: string,
    username: string,
    session: string,
    created: number,
    expires?: number
}