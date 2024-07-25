import { createClient, RedisClientType } from "redis";

export default class RedisClient {
    constructor(
        public client?: RedisClientType<any, any, any>,
        public info?: {
            redis_version?: string,
            os?: string,
            run_id?: string,
        }
    ) { }

    async Init() {
        try {
            await createClient({
                url: process.env.REDIS_URL
            }).connect().then(async client => {
                this.client = client
                console.log("> redis client connected!");

                client.info().then(info => {
                    const result = {};
                    info.split('\r\n').forEach(line => {
                        if (line && !line.startsWith('#')) {
                            const [key, value] = line.split(':');
                            result[key] = value;
                        }
                    });

                    this.info = result
                })
            }).catch(err => console.error(err))
        } catch (error) {
            console.log(error)
        }
    }

    async RunCommand(command: string) {
        const args = command.split(' ');

        try {
            const result = await this.client.sendCommand(args);
            return result
        } catch (err) {
            console.error(err);
            return err
        }
    }
}