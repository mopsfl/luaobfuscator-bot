import { config } from "..";
import DateToTimestamp from "./DateToTimestamp";

export default {
    async GetLastCommitData(): Promise<LastCommitData> {
        const response = await fetch(config.repo_commits_url).then(res => res.json()).catch(console.error)
        if (!response) return

        return {
            last_commit: new Date(response[0].commit.committer.date).getTime() || 0,
            commit_url: response[0].html_url
        }
    }
}

export interface LastCommitData {
    last_commit: number,
    commit_url: string
}