# grammy-entity

[![JSR Badge](https://jsr.io/badges/@qz/grammy-entity?style=flat-square)](https://jsr.io/@qz/grammy-entity)
[![grammY plugin](https://img.shields.io/badge/grammY%20plugin-0284c7?style=flat-square&logo=telegram&logoColor=f7f8fd)](https://grammy.dev/plugins/entity)

A [grammY plugin](https://grammy.dev/plugins/entity) that converts
[Telegram entities](https://core.telegram.org/bots/api#messageentity) to
[HTML](https://core.telegram.org/bots/api#html-style) or
[Markdown](https://core.telegram.org/bots/api#markdownv2-style), derived from
the parent project: [@telegraf/entity](https://github.com/telegraf/entity).

> ⚠️ Before you start using this module, consider using
> [`copyMessage`](https://core.telegram.org/bots/api#copymessage) instead.
>
> This module will produce
> [Telegram-compatible](https://core.telegram.org/bots/api#formatting-options)
> HTML or MarkdownV2. However it is better to simply pass the text and entities
> back to Telegram rather than converting to HTML or Markdown.
>
> This module is really for the rare cases where you want to convert
> Telegram-formatted text for consumption **outside** of Telegram.

```sh
deno add @qz/grammy-entity
```

## Simple usage

Usage is very straightforward!

```ts
import { toHTML, toMarkdownV2 } from "@qz/grammy-entity";

bot.on(":text", async (ctx) => {
  const html = toHTML(ctx.msg); // convert text to HTML string
  const md = toMarkdownV2(ctx.msg); // convert text to MarkdownV2 string
});
```

Both functions will also just work with captioned messages like photos or
videos.

```ts
bot.on(":photo", async (ctx) => {
  const html = toHTML(ctx.msg); // convert caption to HTML string
  const md = toMarkdownV2(ctx.msg); // convert caption to MarkdownV2 string
});
```

You can also directly pass just a text and entities object:

```ts
toHTML({ text: '...', entities: [...] }); // HTML string
```

---

## Advanced usage

`toHTML` and `toMarkdown` produce HTML or Markdown compatible with Telegram
because it's a sensible default for a Telegram library. You may want to
serialize differently, to target a different system. This module exposes a way
to do this: `serializeWith`.

To use this, you must first implement a serializer with the following type:

```ts
import type { Serializer } from "@qz/grammy-entity";

const myHTMLSerializer: Serializer (match, node) {
	// implement
}
```

Each matched node will be passed to your function, and you only need to wrap it
however you want.

Refer to the implementation of the
[serializers](https://github.com/quadratz/grammy-entity/blob/main/src/serializers.ts)
for something you can simply copy-paste and edit to satisfaction.

The built-in escapers are also exported for your convenience:

```ts
import { type Escaper, escapers } from "@qz/grammy-entity";

escapers.HTML(text); // HTML escaped text
escapers.MarkdownV2(text); // escaped for Telegram's MarkdownV2

// or
const myEscaper: Escaper = (match) => {/* implement */};
```

By using both of these tools, you can implement your own HTML serializer like
so:

```ts
import { escapers, serializeWith } from "@qz/grammy-entity";

const serialize = serializeWith(myHTMLSerializer, escapers.HTML);
serialize(ctx.message);
```
