const config = require("../.config")

module.exports = {
    /**
     * @description Creates a command field array for a discord embed with the given <Object> commands
     */
    create: function() {
        try {
            let list = []
            Object.keys(config.command_list).forEach(category => {
                let object = {
                    name: category,
                    value: ""
                }
                config.command_list[category].forEach(cmd => {
                    object.value = object.value + "`" + `${cmd}` + "`" + `${config.command_list[category].indexOf(cmd) == (config.command_list[category].length - 1) ? "" : ","}` + " "
                })
                list.push(object)
            })
            return list
        } catch (e) { console.error(e) }
    }
}