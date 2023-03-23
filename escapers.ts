/** escapeHTML borrowed from https://github.com/feathers-studio/hyperactive/blob/bbd67beace6744c4b8b48637a96c2daed416ebde/hyper/util.ts */

export const HTML = (() => {
	const escapables = {
		"<": "&lt;",
		">": "&gt;",
		"&": "&amp;",
	};

	const toEscape = /<|>|&/g;

	return (s: string) => s.replace(toEscape, r => escapables[r as keyof typeof escapables] || r);
})();

export const MarkdownV2 = (() => {
	const escapables = {
		"_": "\\_",
		"*": "\\*",
		"[": "\\[",
		"]": "\\]",
		"(": "\\(",
		")": "\\)",
		"~": "\\~",
		"`": "\\`",
		">": "\\>",
		"#": "\\#",
		"+": "\\+",
		"-": "\\-",
		"=": "\\=",
		"|": "\\|",
		"{": "\\{",
		"}": "\\}",
		".": "\\.",
		"!": "\\!",
	};

	const toEscape = new RegExp("[" + Object.values(escapables).join("") + "]", "g");

	return (s: string) => s.replace(toEscape, r => escapables[r as keyof typeof escapables] || r);
})();
