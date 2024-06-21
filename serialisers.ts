import type { Serialiser, Node } from "./types.ts";

export const HTML: Serialiser = (match: string, node?: Node) => {
	switch (node?.type) {
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
			if (node.language) return `<pre><code class="language-${node.language}">${match}</code></pre>`;
			return `<pre>${match}</pre>`;
		case "spoiler":
			return `<span class="tg-spoiler">${match}</span>`;
		case "url":
			return `<a href="${node.text}">${match}</a>`;
		case "text_link":
			return `<a href="${node.url}">${match}</a>`;
		case "text_mention":
			return `<a href="tg://user?id=${node.user.id}">${match}</a>`;
		case "blockquote":
			return `<blockquote>${match}</blockquote>`;
		case "expandable_blockquote":
			return `<expandable_blockquote>${match}</blockquote>`;
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
};

export function MarkdownV2(match: string, node?: Node): string {
	switch (node?.type) {
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
			if (node.language) return "```" + node.language + "\n" + match + "\n```";
			return "```\n" + match + "\n```";
		case "spoiler":
			return `||${match}||`;
		case "url":
			return match;
		case "text_link":
			return `[${match}](${node.url})`;
		case "text_mention":
			return `[${match}](tg://user?id=${node.user.id})`;
		case "blockquote":
			return `${match.split("\n").map((line) => `>${line}`).join("\n")}`;
		case "expandable_blockquote":
			return `**${match.split("\n").map((line) => `>${line}`).join("\n")}||`;
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
