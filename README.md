# `@telegraf/entity` [![Deno shield](https://img.shields.io/static/v1?label=Built%20for&message=Deno&style=flat-square&logo=deno&labelColor=000&color=fff)](https://deno.land/x/telegraf_entity) [![Bun shield](https://img.shields.io/static/v1?label=Ready%20for&message=Bun&style=flat-square&logo=bun&labelColor=101115&color=fff)](https://npmjs.com/package/@telegraf/entity) [![NPM version](https://img.shields.io/npm/v/@telegraf/entity?color=e74625&style=flat-square)](https://npmjs.com/package/@telegraf/entity)

Convert Telegram entities to HTML or Markdown.

> ⚠️ Before you start using this module, consider using [`copyMessage`](https://core.telegram.org/bots/api#copymessage) instead.
>
> This module will produce [Telegram-compatible](https://core.telegram.org/bots/api#formatting-options) HTML or MarkdownV2. However it is better to simply pass the text and entities back to Telegram rather than converting to HTML or Markdown.
>
> This module is really for the rare cases where you want to convert Telegram-formatted text for consumption outside of Telegram.

```shell
npm install @telegraf/entity
```

## Simple usage

Usage is very straightforward!

```TS
import { toHTML, toMarkdownV2 } from "@telegraf/entity";
// if Deno:
// import { toHTML, toMarkdownV2 } from "https://deno.land/x/telegraf_entity/mod.ts";

bot.on(message("text"), async ctx => {
	const html = toHTML(ctx.message); // convert text to HTML string
	const md = toMarkdownV2(ctx.message); // convert text to MarkdownV2 string
});
```

Both functions will also just work with captioned messages like photos or videos.

```TS
bot.on(message("photo"), async ctx => {
	const html = toHTML(ctx.message); // convert caption to HTML string
	const md = toMarkdownV2(ctx.message); // convert caption to MarkdownV2 string
});
```

You can also directly pass just a text and entities object:

```TS
toHTML({ text: '...', entities: [...] }); // HTML string
```

---

## Advanced usage

`toHTML` and `toMarkdown` produce HTML or Markdown compatible with Telegram because it's a sensible default for a Telegram library. You may want to serialise differently, to target a different system. This module exposes a way to do this: `serialiseWith`.

To use this, you must first implement a serialiser with the following type:

```TS
import type { Serialiser } from "@telegraf/entity";

const myHTMLSerialiser: Serialiser (match, node) {
	// implement
}
```

Each matched node will be passed to your function, and you only need to wrap it however you want.

Refer to the implementation of the [builtin serialisers](https://github.com/telegraf/entity/blob/master/serialisers.ts) for something you can simply copy-paste and edit to satisfaction.

The builtin escapers are also exported for your convenience:

```TS
import { escapers, type Escaper } from "@telegraf/entity";

escapers.HTML(text); // HTML escaped text
escapers.MarkdownV2(text); // escaped for Telegram's MarkdownV2

// or
const yourEscaper: Escaper = match => { /* implement */ };
```

By using both of these tools, you can implement your own HTML serialiser like so:

```TS
import { serialiseWith, escapers } from "@telegraf/entity";

const serialise = serialiseWith(myHTMLSerialiser, escapers.HTML);
serialise(ctx.message);
```
