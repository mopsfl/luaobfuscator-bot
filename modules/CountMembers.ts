import * as self from "../index"

export default function () {
    return self.statusDisplay?.status_message?.guild?.memberCount || "N/A"
}