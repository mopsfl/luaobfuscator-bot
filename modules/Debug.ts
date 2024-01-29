import * as self from "../index"

export default async function (m: any, p: boolean = false, id?: string) {
    (self.env == "dev" && p || p && console.debug(m) || m instanceof Error) && console.debug(m);
    let debug_cache: any = await self.cache.get("debug");
    if (!debug_cache) {
        await self.cache.set("debug", []);
        debug_cache = await self.cache.get("debug");
    }
    if (id && m) m["errorId"] = id;
    debug_cache.push(m);
    await self.cache.set("cache", debug_cache);
}