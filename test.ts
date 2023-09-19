import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import { toHTML, toMarkdownV2 } from "./mod.ts";

Deno.test("URL entity inside bold must stringify to HTML correctly", () => {
	assertEquals(
		toHTML({
			text: "Hello, https://feathers.studio!",
			entities: [
				{ type: "bold", offset: 0, length: "Hello, https://feathers.studio!".length },
				{ type: "url", offset: "Hello, ".length, length: "https://feathers.studio".length },
			],
		}),
		'<b>Hello, <a href="https://feathers.studio">https://feathers.studio</a>!</b>',
	);

	assertEquals(
		toHTML({
			text: "Hello, feathers.studio!",
			entities: [
				{ type: "bold", offset: 0, length: "Hello, feathers.studio!".length },
				{
					type: "text_link",
					offset: "Hello, ".length,
					length: "feathers.studio".length,
					url: "https://feathers.studio",
				},
			],
		}),
		'<b>Hello, <a href="https://feathers.studio">feathers.studio</a>!</b>',
	);

	// based on https://github.com/telegraf/entity/issues/2
	assertEquals(
		toHTML({
			text: "👉 Link :- https://example.com?x&y",
			entities: [
				{ offset: 0, length: 11, type: "bold" },
				{ offset: 11, length: 23, type: "url" },
				{ offset: 11, length: 23, type: "bold" },
			],
		}),
		'<b>👉 Link :- </b><a href="https://example.com?x&y"><b>https://example.com?x&amp;y</b></a>',
	);
});

Deno.test("URL entity inside bold must stringify to Markdown correctly", () => {
	assertEquals(
		toMarkdownV2({
			text: "Hello, https://feathers.studio!",
			entities: [
				{ type: "bold", offset: 0, length: "Hello, https://feathers.studio!".length },
				{ type: "url", offset: "Hello, ".length, length: "https://feathers.studio".length },
			],
		}),
		"*Hello, https://feathers\\.studio\\!*",
	);

	assertEquals(
		toMarkdownV2({
			text: "Hello, feathers.studio!",
			entities: [
				{ type: "bold", offset: 0, length: "Hello, feathers.studio!".length },
				{
					type: "text_link",
					offset: "Hello, ".length,
					length: "feathers.studio".length,
					url: "https://feathers.studio",
				},
			],
		}),
		"*Hello, [feathers\\.studio](https://feathers.studio)\\!*",
	);

	assertEquals(
		toMarkdownV2({
			text: "👉 Link :- https://example.com",
			entities: [
				{ offset: 0, length: 11, type: "bold" },
				{ offset: 11, length: 19, type: "url" },
				{ offset: 11, length: 19, type: "bold" },
			],
		}),
		"*👉 Link :\\- **https://example\\.com*",
	);
});
