import { assertEquals } from "@std/assert";
import { toHTML, toMarkdownV2 } from "../mod.ts";

Deno.test("URL entity inside bold must stringify to HTML correctly", () => {
  assertEquals(
    toHTML({
      text: "Hello, https://grammy.dev!",
      entities: [
        {
          type: "bold",
          offset: 0,
          length: "Hello, https://grammy.dev!".length,
        },
        {
          type: "url",
          offset: "Hello, ".length,
          length: "https://grammy.dev".length,
        },
      ],
    }),
    '<b>Hello, <a href="https://grammy.dev">https://grammy.dev</a>!</b>',
  );

  assertEquals(
    toHTML({
      text: "Hello, grammy.dev!",
      entities: [
        { type: "bold", offset: 0, length: "Hello, grammy.dev!".length },
        {
          type: "text_link",
          offset: "Hello, ".length,
          length: "grammy.dev".length,
          url: "https://grammy.dev",
        },
      ],
    }),
    '<b>Hello, <a href="https://grammy.dev">grammy.dev</a>!</b>',
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
      text: "Hello, https://grammy.dev!",
      entities: [
        {
          type: "bold",
          offset: 0,
          length: "Hello, https://grammy.dev!".length,
        },
        {
          type: "url",
          offset: "Hello, ".length,
          length: "https://grammy.dev".length,
        },
      ],
    }),
    "*Hello, https://grammy\\.dev\\!*",
  );

  assertEquals(
    toMarkdownV2({
      text: "Hello, grammy.dev!",
      entities: [
        { type: "bold", offset: 0, length: "Hello, grammy.dev!".length },
        {
          type: "text_link",
          offset: "Hello, ".length,
          length: "grammy.dev".length,
          url: "https://grammy.dev",
        },
      ],
    }),
    "*Hello, [grammy\\.dev](https://grammy.dev)\\!*",
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
