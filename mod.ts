import * as serialisers from "./serialisers.ts";
import * as escapers from "./escapers.ts";
import type { Message, TextMessage, Tree, MessageEntity } from "./types.ts";

// https://github.com/tdlib/td/blob/d79bd4b69403868897496da39b773ab25c69f6af/td/telegram/MessageEntity.cpp#L39
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
	spoiler: 94,
	custom_emoji: 99,
};

function findChildren(fromEntityIndex: number, parent: MessageEntity, entities: MessageEntity[]) {
	const ret: MessageEntity[] = [];

	for (let i = fromEntityIndex + 1; i < entities.length; i++) {
		const entity = entities[i];
		if (entity.offset + entity.length > parent.offset + parent.length) break;
		ret.push(entity);
	}

	return ret;
}

const ends = (entity: MessageEntity) => entity.offset + entity.length;

export function toTree(msg: TextMessage, offset = 0, upto = Infinity) {
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
			children: toTree({ text: msg.text, entities: children }, entity.offset, ends(entity)),
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

function serialse(tree: Tree, serialiser: typeof serialisers.HTML, escaper: typeof escapers.HTML) {
	let ret = "";
	for (const node of tree) {
		if (typeof node === "string") ret += escaper(node);
		else ret += serialiser(serialse(node.children, serialiser, escaper), node);
	}
	return ret;
}

const serialiseWith =
	(serialiser: typeof serialisers.HTML, escaper: typeof escapers.HTML) =>
	(message: Message): string => {
		const msg = "text" in message ? message : { text: message.caption || "", entities: message.caption_entities };
		if (!msg.entities || msg.entities.length === 0) return serialiser(msg.text);

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

		return serialse(toTree({ text: msg.text, entities }), serialiser, escaper);
	};

const toHTML = serialiseWith(serialisers.HTML, escapers.HTML);
const toMarkdownV2 = serialiseWith(serialisers.MarkdownV2, escapers.MarkdownV2);

export { serialisers, escapers, serialiseWith, toHTML, toMarkdownV2 };
