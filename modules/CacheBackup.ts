import { gzipSync } from "zlib"
import * as self from "../index"

export default {
    async CreateBackup() {
        return self.utils.NewPromise(10000, (resolve, reject) => {
            const _cacheValues = {}
            Object.keys(self.cacheValues).forEach(async (ckey, idx) => {
                _cacheValues[ckey] = await self.file_cache.get(ckey).catch(console.error)

                if ((idx + 1) === Object.keys(self.cacheValues).length) {
                    try {
                        //@ts-ignore
                        const compressed_backup = self.utils.ToBase64(gzipSync(JSON.stringify(_cacheValues)))
                        await fetch(process.env.CLOUDFLARE_KV_WRITEAPIURL + process.env.CLOUDFLARE_KV_BACKUP_KEY, {
                            method: "POST",
                            body: JSON.stringify({ value: compressed_backup, metadata: { time: new Date().getTime(), saved_keys: Object.keys(self.cacheValues) } })
                        }).then(res => res.json()).then((res: CloudflareKVResponse) => {
                            resolve(res)
                        }).catch(async error => {
                            reject(error)
                            return console.error(error)
                        })
                    } catch (error) {
                        reject(error)
                        return console.error(error)
                    }
                }
            })
        }).catch(err => {
            return err
        })
    }
}

export interface CloudflareKVResponse {
    "errors": Array<any>,
    "messages": Array<any>,
    "success": boolean,
    "result": Object
}