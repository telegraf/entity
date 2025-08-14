// Ported from https://github.com/tdlib/td/blob/056963e48fa8d3f89556239c22d6ac843d3c8a5b/td/telegram/MessageEntity.cpp

type MessageEntity = {
	type:
		| "bold"
		| "italic"
		| "code"
		| "pre"
		| "text_link"
		| "mention"
		| "hashtag"
		| "text_mention"
		| "underline"
		| "strikethrough"
		| "blockquote"
		| "spoiler"
		| "custom_emoji"
		| "expandable_blockquote";
	offset: number;
	length: number;
	url?: string;
	user?: number;
	language?: string;
	custom_emoji_id?: string;
};

import {
	C,
	unreachable,
	is_utf8_character_first_code_unit,
	is_space,
	get_link_user_id,
	decode_html_entity,
	is_alnum,
	append_utf8_character_unsafe,
	to_lower,
	encode,
	decode,
} from "./utils.ts";

const MAX_ATTRIBUTE_LENGTH = 1024;

export namespace Parser {
	const priorities = {
		mention: 50,
		hashtag: 50,
		botcommand: 50,
		url: 50,
		emailaddress: 50,
		bold: 90,
		italic: 91,
		code: 20,
		pre: 11,
		precode: 10,
		texturl: 49,
		mentionname: 49,
		cashtag: 50,
		phonenumber: 50,
		underline: 92,
		strikethrough: 93,
		blockquote: 0,
		bankcardnumber: 50,
		mediatimestamp: 50,
		spoiler: 94,
		customemoji: 99,
		expandableblockquote: 0,
	};

	type MessageEntityType = keyof typeof priorities;

	export function get_type_priority(type: MessageEntityType): number {
		return priorities[type];
	}

	const sortEntities = (entities: MessageEntity[]) => entities.sort((a, b) => a.offset - b.offset);

	export function parse_markdown(text: string): { text: string; entities: MessageEntity[] } {
		const source = encode(text);
		const entities: MessageEntity[] = [];
		const size = source.length;
		let utf16_offset = 0;

		const result = new Uint8Array(size);
		let result_end = 0;

		for (let i = 0; i < size; i++) {
			const c = source[i];
			if (
				c === C.backslash &&
				(source[i + 1] === C.underscore ||
					source[i + 1] === C.asterisk ||
					source[i + 1] === C.backtick ||
					source[i + 1] === C.left_square_bracket)
			) {
				i++;
				// result += source[i];
				result[result_end++] = source[i];
				utf16_offset++;
				continue;
			}
			if (c !== C.underscore && c !== C.asterisk && c !== C.backtick && c !== C.left_square_bracket) {
				if (is_utf8_character_first_code_unit(c)) {
					utf16_offset += 1 + (c >= 0xf0 ? 1 : 0);
				}
				result[result_end++] = c;
				continue;
			}

			// we are at begin of the entity
			let begin_pos = i;
			let end_character = c;
			let is_pre = false;
			if (c === C.left_square_bracket) {
				end_character = C.right_square_bracket;
			}

			i++;

			let language = "";
			if (c === C.backtick && source[i] === C.backtick && source[i + 1] === C.backtick) {
				i += 2;
				is_pre = true;
				let language_end = i;
				while (!is_space(source[language_end]) && source[language_end] !== C.backtick) {
					language_end++;
				}
				if (i !== language_end && language_end < size && source[language_end] !== C.backtick) {
					language = decode(source.slice(i, language_end));
					i = language_end;
				}
				if (source[i] === C.line_feed || source[i] === C.carriage_return) {
					if (
						(source[i + 1] === C.line_feed || source[i + 1] === C.carriage_return) &&
						source[i] !== source[i + 1]
					) {
						i += 2;
					} else {
						i++;
					}
				}
			}

			let entity_offset = utf16_offset;

			while (
				i < size &&
				(source[i] !== end_character ||
					(is_pre && !(source[i + 1] === C.backtick && source[i + 2] === C.backtick)))
			) {
				const cur_ch = source[i];
				if (is_utf8_character_first_code_unit(cur_ch)) {
					utf16_offset += 1 + (cur_ch >= 0xf0 ? 1 : 0);
				}
				result[result_end++] = source[i++];
			}

			if (i === size) {
				throw new Error(`Can't find end of the entity starting at byte offset ${begin_pos}`);
			}

			if (entity_offset !== utf16_offset) {
				const entity_length = utf16_offset - entity_offset;
				switch (c) {
					case C.underscore:
						entities.push({
							type: "italic",
							offset: entity_offset,
							length: entity_length,
						});
						break;
					case C.asterisk:
						entities.push({
							type: "bold",
							offset: entity_offset,
							length: entity_length,
						});
						break;
					case C.left_square_bracket: {
						let url = "";
						if (source[i + 1] !== C.open_parenthesis) {
							url = text.slice(begin_pos + 1, i - begin_pos - 1);
						} else {
							i += 2;
							while (i < size && source[i] !== C.close_parenthesis) {
								url += source[i++];
							}
						}
						const user_id = get_link_user_id(url);
						if (user_id !== -1) {
							entities.push({
								type: "text_mention",
								offset: entity_offset,
								length: entity_length,
								user: user_id,
							});
						} else {
							if (url) {
								entities.push({
									type: "text_link",
									offset: entity_offset,
									length: entity_length,
									url,
								});
							}
						}
						break;
					}
					case C.backtick:
						if (is_pre) {
							if (!language) {
								entities.push({
									type: "pre",
									offset: entity_offset,
									length: entity_length,
								});
							} else {
								entities.push({
									type: "pre",
									offset: entity_offset,
									length: entity_length,
									language,
								});
							}
						} else {
							entities.push({
								type: "code",
								offset: entity_offset,
								length: entity_length,
							});
						}
						break;
					default:
						unreachable();
				}
			}

			if (is_pre) {
				i += 2;
			}
		}

		return { text: decode(result.slice(0, result_end)), entities };
	}

	export function parse_html(text: string): { text: string; entities: MessageEntity[] } {
		const source = encode(text);
		const size = source.length;
		const entities: MessageEntity[] = [];
		let result = new Uint8Array(size);
		let result_end = 0;
		let utf16_offset = 0;
		let need_recheck_utf8 = false;

		interface EntityInfo {
			tag_name: string;
			argument: string;
			entity_offset: number;
			entity_begin_pos: number;
		}

		const nested_entities: EntityInfo[] = [];

		let last_tag = "";

		for (let i = 0; i < size; i++) {
			const c = source[i];
			if (c === C.ampersand) {
				const decoded = decode_html_entity(source, i);
				i = decoded.end_pos;
				const code = decoded.res;
				if (code !== 0) {
					i--;
					utf16_offset += 1 + (code > 0xffff ? 1 : 0);
					if (code >= 0xd800 && code <= 0xdfff) {
						need_recheck_utf8 = true;
					}
					result[result_end++] = code;
					if (result_end > size) {
						throw new Error("Unexpected error: result buffer overflow");
					}
					continue;
				}
			}
			if (c !== C.less_than) {
				if (is_utf8_character_first_code_unit(c)) {
					utf16_offset += 1 + (c >= 0xf0 ? 1 : 0);
				}
				result[result_end++] = c;
				continue;
			}

			const begin_pos = i++;
			if (source[i] !== C.slash) {
				// begin of an entity
				while (!is_space(source[i]) && source[i] !== C.greater_than) {
					i++;
				}
				if (source[i] === C.null_byte) {
					throw new Error("Unclosed start tag at byte offset " + begin_pos);
				}

				const tag_name = decode(source.slice(begin_pos + 1, i)).toLowerCase();
				if (
					tag_name !== "a" &&
					tag_name !== "b" &&
					tag_name !== "strong" &&
					tag_name !== "i" &&
					tag_name !== "em" &&
					tag_name !== "s" &&
					tag_name !== "strike" &&
					tag_name !== "del" &&
					tag_name !== "u" &&
					tag_name !== "ins" &&
					tag_name !== "tg-spoiler" &&
					tag_name !== "tg-emoji" &&
					tag_name !== "span" &&
					tag_name !== "pre" &&
					tag_name !== "code" &&
					tag_name !== "blockquote"
				) {
					throw new Error(`Unsupported start tag "${tag_name}" at byte offset ${begin_pos}`);
				}

				let argument = "";

				while (source[i] !== C.greater_than) {
					while (source[i] !== C.null_byte && is_space(source[i])) {
						i++;
					}
					if (source[i] === C.greater_than) {
						break;
					}
					let attribute_begin_pos = i;
					while (
						!is_space(source[i]) &&
						source[i] !== C.equal &&
						source[i] !== C.greater_than &&
						source[i] !== C.slash &&
						source[i] !== C.double_quote
					) {
						i++;
					}
					const attribute_name = decode(source.slice(attribute_begin_pos, i));
					if (attribute_name.length === 0) {
						throw new Error(
							'Empty attribute name in the tag "' + tag_name + '" at byte offset ' + begin_pos,
						);
					}
					while (source[i] !== C.null_byte && is_space(source[i])) {
						i++;
					}
					if (source[i] !== C.equal) {
						if (source[i] === C.null_byte) {
							throw new Error('Unclosed start tag "' + tag_name + '" at byte offset ' + begin_pos);
						}
						if (tag_name === "blockquote" && attribute_name === "expandable") {
							argument = "1";
						}
						continue;
					}
					i++;
					while (source[i] !== C.null_byte && is_space(source[i])) {
						i++;
					}
					if (source[i] === C.null_byte) {
						throw new Error('Unclosed start tag "' + tag_name + '" at byte offset ' + begin_pos);
					}

					let attribute_value: Uint8Array;

					if (source[i] !== C.single_quote && source[i] !== C.double_quote) {
						// A name token (a sequence of letters, digits, periods, or hyphens). Name tokens are not case sensitive.
						const token_begin_pos = i;
						while (is_alnum(source[i]) || source[i] === C.dot || source[i] === C.dash) {
							i++;
						}
						attribute_value = to_lower(source.slice(token_begin_pos, i - token_begin_pos));

						if (!is_space(source[i]) && source[i] !== C.greater_than) {
							throw new Error("Unexpected end of name token at byte offset " + token_begin_pos);
						}
					} else {
						// A string literal
						const end_character = source[i++];
						let start_index = i;
						let attribute = new Uint8Array(Math.min(MAX_ATTRIBUTE_LENGTH, size - start_index));
						let attribute_end = 0;
						while (source[i] !== end_character && source[i] !== C.null_byte) {
							if (source[i] === C.ampersand) {
								const decoded = decode_html_entity(source, i);
								i = decoded.end_pos;
								const code = decoded.res;
								if (code !== 0) {
									attribute_end = append_utf8_character_unsafe(attribute, attribute_end, code);
									continue;
								}
							}
							attribute[attribute_end++] = source[i++];
						}
						if (source[i] === end_character) {
							i++;
						}

						if (attribute_end > i - start_index) {
							throw new Error("Unexpected error: attribute buffer overflow");
						}

						attribute_value = attribute.slice(0, attribute_end);
					}

					const attribute_value_str = decode(attribute_value);

					if (tag_name === "a" && attribute_name === "href") {
						argument = attribute_value_str;
					} else if (
						tag_name === "code" &&
						attribute_name === "class" &&
						attribute_value_str.startsWith("language-")
					) {
						argument = attribute_value_str.slice(9);
					} else if (
						tag_name === "span" &&
						attribute_name === "class" &&
						attribute_value_str.startsWith("tg-")
					) {
						argument = attribute_value_str.slice(3);
					} else if (tag_name === "tg-emoji" && attribute_name === "emoji-id") {
						argument = attribute_value_str;
					} else if (tag_name === "blockquote" && attribute_name === "expandable") {
						argument = "1";
					}
				}

				if (tag_name === "span" && argument !== "spoiler") {
					throw new Error('Tag "span" must have class "tg-spoiler" at byte offset ' + begin_pos);
				}

				last_tag = tag_name;

				nested_entities.push({ tag_name, argument, entity_offset: utf16_offset, entity_begin_pos: result_end });
			} else {
				// end of an entity
				// (1) -- assertion that nested_entities is not empty
				if (nested_entities.length === 0) {
					throw new Error("Unexpected end tag at byte offset " + begin_pos);
				}

				while (!is_space(source[i]) && source[i] !== C.greater_than) {
					i++;
				}
				let end_tag_name = decode(source.slice(begin_pos + 2, i - begin_pos - 2)).toLowerCase();
				while (is_space(source[i]) && source[i] !== C.null_byte) {
					i++;
				}
				if (source[i] !== C.greater_than) {
					throw new Error("Unclosed end tag at byte offset " + begin_pos);
				}

				const last_nested_entity = nested_entities.at(-1)!; // nested_entities is not empty, asserted above (1)
				const tag_name = last_nested_entity.tag_name;
				if (end_tag_name && end_tag_name !== tag_name) {
					throw new Error(
						"Unmatched end tag at byte offset " +
							begin_pos +
							', expected "</' +
							tag_name +
							'>", found "</' +
							end_tag_name +
							'>"',
					);
				}

				if (utf16_offset > last_nested_entity.entity_offset) {
					const entity_offset = last_nested_entity.entity_offset;
					const entity_length = utf16_offset - entity_offset;
					if (tag_name === "i" || tag_name === "em") {
						entities.push({
							type: "italic",
							offset: entity_offset,
							length: entity_length,
						});
					} else if (tag_name === "b" || tag_name === "strong") {
						entities.push({
							type: "bold",
							offset: entity_offset,
							length: entity_length,
						});
					} else if (tag_name === "s" || tag_name === "strike" || tag_name === "del") {
						entities.push({
							type: "strikethrough",
							offset: entity_offset,
							length: entity_length,
						});
					} else if (tag_name === "u" || tag_name === "ins") {
						entities.push({
							type: "underline",
							offset: entity_offset,
							length: entity_length,
						});
					} else if (
						tag_name === "tg-spoiler" ||
						(tag_name === "span" && last_nested_entity.argument === "spoiler")
					) {
						entities.push({
							type: "spoiler",
							offset: entity_offset,
							length: entity_length,
						});
					} else if (tag_name === "tg-emoji") {
						// TODO: verify that tg-emoji is always a number
						const r_document_id = parseInt(last_nested_entity.argument);
						if (Number.isNaN(r_document_id) || r_document_id === 0) {
							throw new Error("Invalid custom emoji identifier specified");
						}
						entities.push({
							type: "custom_emoji",
							offset: entity_offset,
							length: entity_length,
							custom_emoji_id: String(r_document_id),
						});
					} else if (tag_name === "a") {
						let url = last_nested_entity.argument;
						if (url.length === 0) {
							url = decode(source.slice(last_nested_entity.entity_begin_pos, result_end));
						}
						// TODO: verify this translation
						const user_id = get_link_user_id(url);
						if (user_id !== -1) {
							entities.push({
								type: "text_mention",
								offset: entity_offset,
								length: entity_length,
								user: user_id,
							});
						} else {
							if (url.length > 0) {
								entities.push({
									type: "text_link",
									offset: entity_offset,
									length: entity_length,
									url,
								});
							}
						}
					} else if (tag_name === "pre") {
						const last_entity = entities.at(-1)!;

						if (
							entities.length &&
							last_entity.type === "code" &&
							last_entity.offset === entity_offset &&
							last_entity.length === entity_length &&
							"language" in last_entity &&
							last_entity.language
						) {
							entities.at(-1)!.type = "pre";
						} else {
							entities.push({
								type: "pre",
								offset: entity_offset,
								length: entity_length,
							});
						}
					} else if (tag_name === "code") {
						const last_entity = entities.at(-1)!;

						if (
							entities.length &&
							last_entity.type === "pre" &&
							last_entity.offset === entity_offset &&
							last_entity.length === entity_length &&
							last_nested_entity.argument.length
						) {
							last_entity.language = last_nested_entity.argument;
						} else {
							entities.push({
								type: "code",
								offset: entity_offset,
								length: entity_length,
								language: last_nested_entity.argument,
							});
						}
					} else if (tag_name === "blockquote") {
						if (last_nested_entity.argument.length) {
							entities.push({
								type: "expandable_blockquote",
								offset: entity_offset,
								length: entity_length,
							});
						} else {
							entities.push({
								type: "blockquote",
								offset: entity_offset,
								length: entity_length,
							});
						}
					} else unreachable();
				}
				nested_entities.pop();
			}
		}

		if (nested_entities.length) {
			throw new Error(
				"Can't find end tag corresponding to start tag \"" + nested_entities.at(-1)!.tag_name + '"',
			);
		}

		for (const entity of entities) {
			if (entity.type === "code" && "language" in entity) {
				// (2) remove language property in "code" entity
				delete entity.language;
			}
		}

		result = result.slice(0, result_end);

		if (need_recheck_utf8) {
			try {
				decode(result.slice(0, result_end), "utf-8", { fatal: true });
			} catch {
				throw new Error(
					"Text contains invalid Unicode characters after decoding HTML entities, check for unmatched surrogate code units",
				);
			}
		}

		return { text: decode(result), entities: sortEntities(entities) };
	}
}
