import { statusDisplayController } from "../index"

export default function () {
    return statusDisplayController?.status_message?.guild?.memberCount || "N/A"
}