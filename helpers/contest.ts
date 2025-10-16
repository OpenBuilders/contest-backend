import { truncateString } from "./string";
import he from "he";
import { domPurify } from "../utils/dompurify";
import { type Languages, t } from "../utils/i18n";

export function generateContestCaption(
	title: string,
	prize: string | undefined,
	deadline: number,
	fee: number,
	description: string,
	lang: Languages = "en",
) {
	let text = `<b>${title}</b>\n`;

	if (prize) {
		text += `\n🏆 ${t(lang, "general.contest.caption.reward")}: <b>${prize}</b>`;
	}

	text += `\n🗓 ${t(lang, "general.contest.caption.deadline")}: <b>${new Date(
		deadline * 1000,
	).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	})}</b>`;

	if (fee > 0) {
		text += `\n🎫 ${t(lang, "general.contest.caption.fee.fee")}: <b>${fee} TON</b>`;
	} else {
		text += `\n🎫 <b>${t(lang, "general.contest.caption.fee.free")}</b>`;
	}

	text += `\n\n${truncateString(
		he.decode(
			domPurify.sanitize(description, {
				KEEP_CONTENT: true,
				ALLOWED_TAGS: [],
				ALLOWED_ATTR: [],
				IN_PLACE: true,
			}),
		),
		768,
	)}`;

	return text;
}
