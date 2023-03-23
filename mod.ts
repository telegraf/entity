import type { MessageEntity } from "https://esm.sh/typegram@4.3.0";
import * as serialisers from "./serialisers.ts";
import * as escapers from "./escapers.ts";

const filterFromIndex = <T>(xs: T[], index: number, when: (x: T, index: number) => boolean) => {
	let i = index;
	const ret = Array<T>();
	while (i < xs.length && when(xs[i], i)) ret.push(xs[i]), i++;
	return ret;
};

const serialiseWith =
	(serialiser: typeof serialisers.HTML) =>
	(message: { text: string; entities?: MessageEntity[] }): string => {
		if (!message.entities || message.entities.length === 0) return serialiser(message.text);

		const text = message.text;
		let ret = "";
		let index = 0;

		const entities = message.entities.sort((a, b) => a.offset - b.offset);

		for (let i = 0; i < entities.length; i++) {
			const entity = entities[i];

			// slice plaintext before current entity
			const before = text.slice(index, entity.offset);
			ret += serialiser(before);

			const ends = entity.offset + entity.length;

			const inside = filterFromIndex(entities, i + 1, entity => entity.offset < ends)
				// reduce offset to match the new text we're going to send
				.map(each => ((each.offset -= entity.offset), each));

			const match = text.slice(entity.offset, ends);

			console.log(entity, index, ends, text);
			console.log({ match, type: entity.type });
			const serialisedMatch = serialiseWith(serialiser)({ text: match, entities: inside });
			ret += serialiser(serialisedMatch, entity, !Boolean(inside.length));

			index = ends;
			i += inside.length;
		}

		// slice plaintext after last entity
		const after = text.slice(index);
		ret += serialiser(after);

		return ret;
	};

const toHTML = serialiseWith(serialisers.HTML);
const toMarkdownV2 = serialiseWith(serialisers.MarkdownV2);

export { serialisers, escapers, serialiseWith, toHTML, toMarkdownV2 };
