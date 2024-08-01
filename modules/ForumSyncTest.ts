// this is a test module for the luaobfuscator.com forum syncing
// this has nothing to do with the discord bot

// notes:
// here are some things you still have to do:
//                                           sort the threads and replies from discord and website into the right order by the creation time (<thread>.createdTimestamp). shouldnt be that hard ig
//                                           make sure you cant do xss. because currently you can by just sending stuff like <h1>asd</h1> in discord
//                                           handle attachments and images/gifs

import { AnyThreadChannel, Client, Message, MessageMentions, PartialMessage, ThreadChannel, User } from "discord.js";
import { config, cache, client } from "../index";
import self from "./ForumSyncTest"

export default {
    // this fetches all the forum threads at once. do this when the server starts or you just want to update the cache or whatever blabla
    async FetchForumData(channelId: string): Promise<[Array<ForumThread> | Object, boolean, boolean]> {
        try {
            const _cachedThreadsFetch: Array<ForumThread> = await cache.get(`_luaobfForumFetchCache_${channelId}`)
            if (_cachedThreadsFetch) { console.log("> [Forum Sync Test]: use cached forum threads."); return [_cachedThreadsFetch, true, true] }
            const _threads = [];

            const channel = await client.channels.fetch(channelId);
            if (!channel?.isThreadOnly()) return [{ message: `Channel is not a forum channel.` }, false, undefined]

            const threadsFetch = await channel.threads.fetch()
            for (const forumThread of threadsFetch.threads.values()) {
                const threadOwner = client.users.cache.get(forumThread.ownerId) || await client.users.fetch(forumThread.ownerId), // get userInfo from id. get it from your db or whatever or just get it from cache or fetch it
                    firstMessage = await forumThread.fetchStarterMessage().catch(console.error),
                    _threadData = self.ToForumThreadData(forumThread, threadOwner, firstMessage || undefined);

                const threadMessagesFetch = await forumThread.messages.fetch()
                for (const message of threadMessagesFetch.values()) {
                    _threadData.messages.push(self.ToForumThreadMessage(message));
                }

                _threads.push(_threadData);
            }

            cache.set(`_luaobfForumFetchCache_${channelId}`, _threads, 3.6e+6) // cache for 1 hour
            console.log("> [Forum Sync Test]: fetched all forum threads.");
            return [_threads, true, false]
        } catch (error) {
            console.error(error)
            return [error, false, undefined]
        }
    },

    // add a new thread to the cache when `client.on<threadCreate>` is triggered
    async HandleNewThread(thread: AnyThreadChannel, newlyCreated: boolean) {
        if (!thread.parent.isThreadOnly() || !newlyCreated) return // check if its a forum thread and not any other thread like message reply thread thing
        console.log(`> [Forum Sync Test]: new forum thread (${thread.id})`);

        let _cachedThreadsFetch: Array<ForumThread> = await cache.get(`_luaobfForumFetchCache_${thread.parentId}`)
        if (!_cachedThreadsFetch) return

        let threadOwner = client.users.cache.get(thread.ownerId) || await client.users.fetch(thread.ownerId),
            firstMessage = await thread.fetchStarterMessage().catch(console.error) // get the first message of the thread. (the message the author created the thread with)

        _cachedThreadsFetch.unshift(self.ToForumThreadData(thread, threadOwner, firstMessage || undefined))

        await cache.set(`_luaobfForumFetchCache_${thread.parentId}`, _cachedThreadsFetch)
        console.log(`> [Forum Sync Test]: new forum thread added to cache! (${thread.id})`);
    },

    async HandleDeletedThread(thread: AnyThreadChannel) { // just remove the thread from the cache
        if (!thread.parent.isThreadOnly()) return // check if its a forum thread and not any other thread like message reply thread thing
        console.log(`> [Forum Sync Test]: forum thread deleted (${thread.id})`);

        let _cachedThreadsFetch: Array<ForumThread> = await cache.get(`_luaobfForumFetchCache_${thread.parentId}`)
        if (!_cachedThreadsFetch) return

        const cachedThreadIndex = _cachedThreadsFetch.findIndex(_thread => _thread.id == thread.id);
        if (cachedThreadIndex > -1) _cachedThreadsFetch.splice(cachedThreadIndex, 1)

        await cache.set(`_luaobfForumFetchCache_${thread.parentId}`, _cachedThreadsFetch)
        console.log(`> [Forum Sync Test]: removed deleted thread from cache! (${thread.id})`);
    },

    async HandleDeletedThreadMessage(message: Message | PartialMessage) { // just remove the message from the thread in cache
        if (!message.channel.isThread()) return // check if its a forum thread and not any other thread like message reply thread thing
        console.log(`> [Forum Sync Test]: forum thread message deleted (${message.id})`);

        let _cachedThreadsFetch: Array<ForumThread> = await cache.get(`_luaobfForumFetchCache_${message.channel.parentId}`)
        if (!_cachedThreadsFetch) return console.log("not found");
        const thread = _cachedThreadsFetch.find(thread => thread.id == message.channelId)

        if (!thread) return

        const cachedThreadMessageIndex = thread.messages.findIndex(_message => _message.id == message.id);
        if (cachedThreadMessageIndex > -1) thread.messages.splice(cachedThreadMessageIndex, 1)

        await cache.set(`_luaobfForumFetchCache_${thread.id}`, _cachedThreadsFetch)
        console.log(`> [Forum Sync Test]: removed deleted thread message from cache! (${message.id})`);
    },

    async HandleNewThreadMessage(message: Message) {
        if (!message.channel.isThread()) return
        console.log(`> [Forum Sync Test]: new thread reply (${message.id})`);

        let _cachedThreadsFetch: Array<ForumThread> = await cache.get(`_luaobfForumFetchCache_${message.channel.parentId}`)
        if (!_cachedThreadsFetch) return
        const thread = _cachedThreadsFetch.find(thread => thread.id == message.channelId)

        if (!thread) return console.log("> [Forum Sync Test]: thread not found");

        thread.messages.push(self.ToForumThreadMessage(message))

        await cache.set(`_luaobfForumFetchCache_${thread.id}`, _cachedThreadsFetch)
        console.log(`> [Forum Sync Test]: new thread reply added to cache! (${thread.id}) - ${message.id}`);
    },

    ToForumThreadData(forumThread: AnyThreadChannel, threadOwner: User, firstMessage: Message): ForumThread {
        return {
            name: forumThread.name,
            firstMessage: { content: firstMessage.content, id: firstMessage.id },
            id: forumThread.id,
            ownerId: forumThread.ownerId,
            totalMessageSent: forumThread.totalMessageSent,
            createdTimestamp: forumThread.createdTimestamp,
            messages: [],
            author: {
                username: threadOwner?.username,
                globalName: threadOwner?.globalName,
                avatar: threadOwner?.avatar,
                avatarURL: threadOwner?.avatarURL(),
                id: threadOwner?.id,
            }
        }
    },

    ToForumThreadMessage(message: Message): ForumThreadMessage {
        return {
            author: {
                username: message.author?.username,
                globalName: message.author?.globalName,
                avatar: message.author?.avatar,
                avatarURL: message.author?.avatarURL(),
                id: message.author?.id,
            },
            pinned: message.pinned,
            content: message.content,
            id: message.id,
            mentions: message.mentions,
            createdTimestamp: message.createdTimestamp,
        }
    }
}

export interface ForumThread {
    name?: string,
    firstMessage?: { content: string, id: string },
    id?: string,
    ownerId?: string,
    totalMessageSent?: number,
    createdTimestamp?: number,
    messages?: Array<ForumThreadMessage>,
    author: UserInfo
}

export interface ForumThreadMessage {
    author: UserInfo,
    pinned: boolean,
    content: string,
    id: string,
    mentions: MessageMentions,
    createdTimestamp: number,
}

export interface UserInfo { username: string, globalName: string, avatar: string, avatarURL: string, id: string }