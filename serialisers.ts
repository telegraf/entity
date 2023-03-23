import type { MessageEntity } from "https://esm.sh/typegram@4.3.0";
import * as escapers from "./escapers.ts";

export function HTML(match: string, entity?: MessageEntity, escape = true): string {
	match = escape ? escapers.HTML(match) : match;

	switch (entity?.type) {
		case "bold":
			return `<b>${match}</b>`;
		case "italic":
			return `<i>${match}</i>`;
		case "underline":
			return `<u>${match}</u>`;
		case "strikethrough":
			return `<del>${match}</del>`;
		case "code":
			return `<code>${match}</code>`;
		case "pre":
			if (entity.language) return `<pre><code class="language-${entity.language}">${match}</code></pre>`;
			return `<pre>${match}</pre>`;
		case "spoiler":
			return `<span class="tg-spoiler">${match}</span>`;
		case "url":
			return `<a href="${match}">${match}</a>`;
		case "text_link":
			return `<a href="${entity.url}">${match}</a>`;
		case "text_mention":
			return `<a href="tg://user?id=${entity.user.id}">${match}</a>`;
		case "mention":
		case "custom_emoji":
		case "hashtag":
		case "cashtag":
		case "bot_command":
		case "phone_number":
		case "email":
		default:
			return match;
	}
}

export function MarkdownV2(match: string, entity?: MessageEntity, escape = true): string {
	match = escape ? escapers.MarkdownV2(match) : match;

	switch (entity?.type) {
		case "bold":
			return `*${match}*`;
		case "italic":
			return `_${match}_`;
		case "underline":
			return `__${match}__`;
		case "strikethrough":
			return `~${match}~`;
		case "code":
			return `\`${match}\``;
		case "pre":
			if (entity.language) return "```" + entity.language + "\n" + match + "\n```";
			return "```\n" + match + "\n```";
		case "spoiler":
			return `||${match}||`;
		case "url":
			return match;
		case "text_link":
			return `[${match}](${entity.url})`;
		case "text_mention":
			return `[${match}](tg://user?id=${entity.user.id})`;
		case "mention":
		case "custom_emoji":
		case "hashtag":
		case "cashtag":
		case "bot_command":
		case "phone_number":
		case "email":
		default:
			return match;
	}
}
