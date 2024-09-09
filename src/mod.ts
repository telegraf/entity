import { serializeHtml, serializeMarkdownV2 } from "./serializers.ts";
import { escapeHtml, escapeMarkdownV2 } from "./escapers.ts";
import type {
  Escaper,
  Message,
  MessageEntity,
  Serializer,
  TextMessage,
  Tree,
} from "./types.ts";

// https://github.com/tdlib/td/blob/87d881071fe514936bb17029e96761141287d2be/td/telegram/MessageEntity.cpp#L39
const TYPE_PRIORITY: Record<MessageEntity["type"], number> = {
  mention: 50,
  hashtag: 50,
  bot_command: 50,
  url: 50,
  email: 50,
  bold: 90,
  italic: 91,
  code: 20,
  pre: 11,
  text_link: 49,
  text_mention: 49,
  cashtag: 50,
  phone_number: 50,
  underline: 92,
  strikethrough: 93,
  blockquote: 0,
  spoiler: 94,
  custom_emoji: 99,
  expandable_blockquote: 0,
};

/**
 * Find child entities of a given parent entity.
 */
function findChildren(
  fromEntityIndex: number,
  parent: MessageEntity,
  entities: Array<MessageEntity>,
): Array<MessageEntity> {
  const ret: MessageEntity[] = [];

  for (let i = fromEntityIndex + 1; i < entities.length; i++) {
    const entity = entities[i];
    if (entity.offset + entity.length > parent.offset + parent.length) break;
    ret.push(entity);
  }

  return ret;
}

/**
 * Get the end position of an entity.
 */
const ends = (entity: MessageEntity): number => entity.offset + entity.length;

/**
 * Convert a message to a tree structure based on its entities.
 */
function toTree(msg: TextMessage, offset = 0, upto = Infinity) {
  if (!msg.entities?.length) return [msg.text.slice(offset, upto)];

  const nodes: Tree = [];

  let last = offset;

  let i = 0;
  while (i < msg.entities.length) {
    const entity = msg.entities[i];

    // there's some text that isn't in an entity
    if (last < entity.offset) {
      nodes.push(msg.text.slice(last, entity.offset));
      last = entity.offset;
    }

    const children = findChildren(i, entity, msg.entities);
    const node = {
      ...entity,
      text: msg.text.slice(entity.offset, ends(entity)),
      children: toTree(
        { text: msg.text, entities: children },
        entity.offset,
        ends(entity),
      ),
    };

    last = ends(node);

    nodes.push(node);
    i += children.length + 1;
  }

  if (last < upto) {
    const final = msg.text.slice(last, upto);
    if (final) nodes.push(final);
  }

  return nodes;
}

/**
 * Serialize a tree structure into a string using the specified serializer and escaper.
 */
function serialize(
  tree: Tree,
  serializer: typeof serializeHtml,
  escaper: typeof escapeHtml,
) {
  let result = "";
  for (const node of tree) {
    if (typeof node === "string") result += escaper(node);
    else {result += serializer(
        serialize(node.children, serializer, escaper),
        node,
      );}
  }
  return result;
}

/**
 * Creates a serialization function that converts messages to a specified format using the provided serializer and escaper.
 */
function serializeWith(serializer: Serializer, escaper: Escaper) {
  return (message: Message): string => {
    const msg = "text" in message
      ? message
      : { text: message.caption || "", entities: message.caption_entities };
    if (!msg.entities || msg.entities.length === 0) return serializer(msg.text);

    const entities = msg.entities.sort((a, b) => {
      if (a.offset < b.offset) return -1;
      if (a.offset > b.offset) return 1;
      if (a.length > b.length) return -1;
      if (a.length < b.length) return 1;
      const a_priority = TYPE_PRIORITY[a.type];
      const b_priority = TYPE_PRIORITY[b.type];
      if (a_priority < b_priority) return -1;
      if (a_priority > b_priority) return 1;
      return 0;
    });

    return serialize(toTree({ text: msg.text, entities }), serializer, escaper);
  };
}

/**
 * Convert entities to [HTML string](https://core.telegram.org/bots/api#html-style).
 *
 * @example
 * ```ts
 *  import { toHTML } from "@qz/grammy-entity";
 *
 *  bot.on(":text", async (ctx) => {
 *    const html = toHTML(ctx.msg);
 *    // Alternatively, you can directly pass a text and entities object
 *    const html = toHTML({ text: ctx.msg.text, entities: ctx.msg.entities });
 *  });
 * ```
 */
export const toHTML: (message: Message) => string = serializeWith(
  serializeHtml,
  escapeHtml,
);

/**
 * Convert entities to [MarkdownV2 string](https://core.telegram.org/bots/api#markdownv2-style).
 *
 * @example
 * ```ts
 *  import { toMarkdownV2 } from "@qz/grammy-entity";
 *
 *  bot.on(":text", async (ctx) => {
 *    const html = toMarkdownV2(ctx.msg);
 *    // Alternatively, you can directly pass a text and entities object
 *    const html = toMarkdownV2({ text: ctx.msg.text, entities: ctx.msg.entities });
 *  });
 * ```
 */
export const toMarkdownV2: (message: Message) => string = serializeWith(
  serializeMarkdownV2,
  escapeMarkdownV2,
);
