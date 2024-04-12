import * as self from "../index"
import { randomUUID } from "crypto"

export default class UserPluginSaves {
    constructor(
        public file_cache_name = "customobfuscate_usersaves",
    ) { }

    async GetUserPluginSaves(userid: string): Promise<Array<UserPluginSave>> {
        const usersaves_cache = self.file_cache.getSync(this.file_cache_name)
        const _usersaves = usersaves_cache[userid] || {}

        return _usersaves
    }

    async SaveUserPluginPreset(userid: string, plugins: {}) {
        const _userPresetSaveId = randomUUID()
        const usersaves_cache = self.file_cache.getSync(this.file_cache_name)
        if (!usersaves_cache[userid]) usersaves_cache[userid] = {}

        usersaves_cache[userid][_userPresetSaveId] = plugins
        self.file_cache.setSync(this.file_cache_name, usersaves_cache)

        return [_userPresetSaveId, plugins]
    }

    GetPluginNamesFromPluginObject(obj: {}, ignoredValues = []) {
        let _pluginNames = []
        function traverse(_obj: {}) {
            Object.keys(_obj).forEach(key => {
                if (Array.isArray(_obj[key]) && !ignoredValues.includes(_obj[key])) {
                    _pluginNames.push(key)
                } else if (typeof _obj[key] === "object") {
                    traverse(_obj[key]);
                } else {
                    if (!ignoredValues.includes(_obj[key])) _pluginNames.push(key)
                }
            });
        }
        traverse(obj);
        return _pluginNames
    }
}

export interface UserPluginSave {
    plugins: Array<string>
}