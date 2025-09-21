import type { MessageEntity } from "nyx-bot-client";

export function encodeEntitiesToHTML(
	text: string,
	entities: MessageEntity[] = [],
) {
	if (!entities.length) return text;

	// Sort entities by offset descending so replacement doesn't mess up indices
	entities.sort((a, b) => b.offset - a.offset);

	for (const entity of entities) {
		const { offset, length, type } = entity;
		const entityText = text.slice(offset, offset + length);

		let htmlTag = "";

		switch (type) {
			case "bold":
				htmlTag = `<b>${entityText}</b>`;
				break;
			case "italic":
				htmlTag = `<i>${entityText}</i>`;
				break;
			case "underline":
				htmlTag = `<u>${entityText}</u>`;
				break;
			case "strikethrough":
				htmlTag = `<s>${entityText}</s>`;
				break;
			case "code":
				htmlTag = `<code>${entityText}</code>`;
				break;
			case "pre":
				htmlTag = `<pre${entity.language ? ` class="language-${entity.language}"` : ""}>${entityText}</pre>`;
				break;
			case "text_link":
				htmlTag = `<a href="${(entity as any).url}" target="_blank">${entityText}</a>`;
				break;
			case "text_mention":
				// Mention with user object
				htmlTag = `<a href="tg://user?id=${entity.user.id}">${entityText}</a>`;
				break;
			default:
				htmlTag = entityText;
		}

		// Replace in the text
		text = text.slice(0, offset) + htmlTag + text.slice(offset + length);
	}

	return text;
}
