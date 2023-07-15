import * as self from "../index"
import { Channel, Message, MessageType, TextChannel } from "discord.js";
import Config from "../config"

export default class StatusDisplay {
    constructor(
        public status_channel?: TextChannel,
        public status_message?: Message
    ) { }

    async init() {
        await self.client.channels.fetch(self.config.STATUS_DISPLAY.STATUS_CHANNEL_ID).then(async channel => {
            //@ts-ignore
            this.status_channel = channel
            await this.status_channel.messages.fetch().then(messages => {
                this.status_message = messages.first()
            })
        }).catch(async err => await self.Debug(err))
    }
}