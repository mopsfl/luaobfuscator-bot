// todo: cleaner way to manage command node and command type cuz its messy rn

import path from "path";
import config from "../config"
import fs from "fs"
import { ChatInputCommandInteraction, GuildMember, InteractionType, Message, MessageType, OmitPartialGroupDMChannel, PermissionFlagsBits, Routes, SlashCommandBuilder, User } from "discord.js";
import { discordREST, ENV, statusDisplayController } from "../index";
import Database from "./Database/Database";
import ErrorHandler from "./ErrorHandler/ErrorHandler";

export default class CommandHandler {
    constructor(
        readonly commands_directory = `${process.cwd()}/dist/commands`,
        readonly prefix = config.prefix,

        public commands = new Map<string, CommandNode>(),
        public slash_commands = new Map<string, CommandNode>(),
        public aliases = new Map<string, string>(),

        public CommandCategories = {
            LuaObfuscator: "Lua Obfuscator",
            Bot: "Bot",
            Misc: "Misc",
            Admin: "Admin"
        },

        public cooldowns = new Map<string, number>()
    ) { }

    public async OnMessageCreate(message: OmitPartialGroupDMChannel<Message<boolean>>) {
        if (message.channelId === statusDisplayController.statusChannel.id && message.type === MessageType.Default) {
            return message.delete().catch(console.error)
        }

        if (message.author.bot || !message.content?.startsWith(this.prefix)) return

        const command = this.ParseCommandFromMessage(message)
        if (command) await this.ExecuteCommand(command)
    }

    public async OnInteractionCreate(interaction: ChatInputCommandInteraction) {
        if (!interaction.isChatInputCommand()) return

        const command = this.ParseCommandFromInteraction(interaction)
        if (command) await this.ExecuteCommand(command)
    }

    private async ExecuteCommand(command: Command) {
        if (!this.IsCommandRunnable(command)) return

        if (this.cooldowns.get(command.user.id)) {
            if ((Date.now() - this.cooldowns.get(command.user.id)) < 2000) {
                ErrorHandler.new({
                    message: command.message,
                    error: `You are using commands too fast! Please wait...`,
                    ttl: 2000
                })
                return false
            } else this.cooldowns.delete(command.user.id)
        }

        try {
            this.cooldowns.set(command.user.id, Date.now())

            await command.callback(command)
            console.log(`> command '${command.name}', requested by '${this.GetInvokerName(command)}', finished in ${Date.now() - command.timestamp}ms (id: ${command.id})`)
            this.UpdateCommandStatistic(command)
        } catch (error) {
            ErrorHandler.new({
                message: command.message,
                error: error
            })

            this.cooldowns.delete(command.user.id)
            console.error(`[Command Handler Error]: error occurred while trying to execute command '${command.name}'!`, error)
        }
    }

    private IsCommandRunnable(command: Command): boolean {
        if (!command.callback || typeof command.callback !== "function") {
            ErrorHandler.new({ message: command.message, error: `unable to execute command. (missing <${command.name}.callback()>)` })
            return false
        }
        if (!command.allowDirectMessage && command.message?.channel?.isDMBased()) {
            ErrorHandler.new({ message: command.message, error: `This command is disabled in direct messages!` })
            return false
        }
        if (!command.hasPermission) {
            ErrorHandler.new({ message: command.message, error: `You are not allowed to execute this command!` })
            return false
        }

        return true
    }

    public ParseCommandFromMessage(message: Message): Command | null {
        const parts = message.content
            .replace(/`+[^`]*`+/gm, "")
            .trim()
            .slice(this.prefix.length)
            .split(/\s+/)

        const name = parts.shift()?.toLowerCase()
        if (!name) return null

        return this.BuildCommand(this.commands.get(name) || this.commands.get(this.aliases.get(name)), {
            id: "",
            user: message.author,
            name,
            arguments: parts,
            raw_arguments: parts.join(" "),
            message,
        })
    }

    public ParseCommandFromInteraction(interaction: ChatInputCommandInteraction): Command | null {
        const args = interaction.options.data.map(opt => String(opt.value))

        return this.BuildCommand(this.slash_commands.get(interaction.commandName.toLowerCase()), {
            id: "",
            user: interaction.user,
            name: interaction.commandName.toLowerCase(),
            arguments: args,
            raw_arguments: args.join(" "),
            interaction,
        })
    }

    public BuildCommand(commandNode: CommandNode | undefined, base: Partial<Command>): Command | null {
        if (!commandNode) return null;

        return {
            ...base,
            name: Array.isArray(commandNode.name) ? commandNode.name[0] : commandNode.name,
            timestamp: Date.now(),
            isPublic: commandNode.public_command ?? true,
            isSlashCommand: commandNode.slash_command ?? false,
            allowDirectMessage: commandNode.direct_message !== false,
            callback: commandNode.callback,
            hasPermission: !commandNode.permissions?.length || commandNode.permissions.every(permissionBit =>
                this.CheckUserPermission("member" in base && base.member instanceof GuildMember ? base.member : null, permissionBit)
            ),
        } as Command
    }

    private GetInvokerName(command: Command): string {
        return (command.message?.author.username || command.interaction?.user.username || "N/A")
    }

    public CheckUserPermission(user?: GuildMember, permissionBit?: bigint) {
        if (!user) return false
        return user?.permissions.has(permissionBit) || user?.permissions.has(PermissionFlagsBits.Administrator)
    }

    public async RegisterCommands() {
        console.log("> registering commands...")

        const command_paths = this.ParseAllCommands(this.commands_directory),
            clientId = process.env[ENV === "prod" ? "CLIENT_ID" : "CLIENT_ID_DEV"],
            start_tick = Date.now()

        command_paths.forEach((path, name) => {
            try {
                let node: CommandNode = new (require(path))()
                if (!node) return console.error(`[Command Handler Error]: unable to initialize command '${name}'. (unable to require command constructor)`)

                if (name.startsWith("slashcommands")) {
                    if (!node.slashCommandBuilder || typeof node.slashCommandBuilder.toJSON !== "function") {
                        console.warn(`[Command Handler Error]: unable to register slash command ${name}. (missing slash command builder)`)
                        return
                    }

                    this.slash_commands.set(node.name[0], node)
                    return
                }

                this.commands.set(node.name[0], node)

                if (Array.isArray(node.name)) {
                    for (const alias of node.name.slice(1)) {
                        this.aliases.set(alias, node.name[0])
                    }
                }
            } catch (error) {
                console.error(`[Command Handler Error]: unable to initialize command '${name}'`, error)
            }
        })

        console.log(`> registered ${this.commands.size} chat command(s). (took ${Date.now() - start_tick}ms)`)

        if (this.slash_commands.size > 0) {
            const start_tick_slash = Date.now()
            console.log(`> registering slash commands...`)

            await discordREST.put(Routes.applicationCommands(clientId), { body: [...this.slash_commands.values()].map(node => node.slashCommandBuilder.toJSON()) }).then(() => {
                console.log(`> registered ${this.slash_commands.size} slash command(s). (took ${Date.now() - start_tick_slash}ms)`)
            }).catch(error => {
                console.error(`[Command Handler Error]: unable to register slash command(s)!`, error)
            })
        }
    }

    private ParseAllCommands(dir: fs.PathLike): Map<string, string> {
        const commands = new Map<string, string>();

        const traverse = (d: string, prefix = "") => {
            for (const entry of fs.readdirSync(d)) {
                const full_path = path.join(d, entry);
                if (fs.lstatSync(full_path).isDirectory()) {
                    traverse(full_path, `${prefix}${entry}/`);
                } else {
                    commands.set(prefix ? `${prefix}${path.parse(entry).name}` : `${path.basename(dir.toString())}/${path.parse(entry).name}`, full_path);
                }
            }
        };

        traverse(dir.toString());
        return commands;
    }

    public async UpdateCommandStatistic(command: Command) {
        await Database.RowExists("cmd_stats", { command_name: command.name }).then(async exists => {
            if (!exists) {
                await Database.Insert("cmd_stats", { command_name: command.name, call_count: 1 }).catch(console.error)
            } else {
                await Database.Increment("cmd_stats", "call_count", { command_name: command.name }).catch(console.error)
            }
        })

        await Database.Increment("bot_statistics", "total_commands_executed").catch(console.error)
    }
}

export type Command = {
    user?: User,
    name?: string,
    id?: string,
    arguments?: Array<any>,
    raw_arguments?: string,
    message?: Message,
    interaction?: ChatInputCommandInteraction,
    isPublic?: boolean,
    isSlashCommand?: boolean,
    hasPermission?: boolean,
    allowDirectMessage?: boolean,
    callback?: (command: Command) => Promise<any>,
    timestamp?: number,
}

export interface CommandNode {
    name: string | Array<string>,
    callback: (command: Command) => Promise<any>,
    permissions?: Array<bigint>,
    required_roles?: Array<string>,
    category: string,
    direct_message?: boolean,
    description: string,
    syntax_usage?: string,
    public_command?: boolean,
    slash_command?: boolean,
    hidden?: boolean,
    slashCommandBuilder?: any
}