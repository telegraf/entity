// codepoints in hex
export const enum C {
	utf8_first_byte = 0xc0,
	utf8_continuation_byte = 0x80,
	space = 0x20,
	tab = 0x09,
	carriage_return = 0x0d,
	line_feed = 0x0a,
	null_byte = 0x00,
	vertical_tab = 0x0b,
	ampersand = 0x26,
	hash = 0x23,
	a = 0x61,
	f = 0x66,
	z = 0x7a,
	x = 0x78,
	zero = 0x30,
	nine = 0x39,
	backslash = 0x5c,
	underscore = 0x5f,
	asterisk = 0x2a,
	backtick = 0x60,
	left_square_bracket = 0x5b,
	right_square_bracket = 0x5d,
	open_parenthesis = 0x28,
	close_parenthesis = 0x29,
	less_than = 0x3c,
	slash = 0x2f,
	greater_than = 0x3e,
	equal = 0x3d,
	double_quote = 0x22,
	single_quote = 0x27,
	dot = 0x2e,
	dash = 0x2d,
	semicolon = 0x3b,
}

export function is_utf8_character_first_code_unit(c: number): boolean {
	return (c & C.utf8_first_byte) != C.utf8_continuation_byte;
}

export function is_space(c: number): boolean {
	return (
		c == C.space ||
		c == C.tab ||
		c == C.carriage_return ||
		c == C.line_feed ||
		c == C.null_byte ||
		c == C.vertical_tab
	);
}

// url is of the format tg://user?id=123456789
export function get_link_user_id(url: string): number {
	const result = /^tg:\/\/user\?id=(\d+)/.exec(url)?.[1];
	if (!result) return -1;
	return parseInt(result);
}

export function is_alpha(c: number): boolean {
	c |= C.space;
	return C.a <= c && c <= C.z;
}

export function is_digit(c: number): boolean {
	return C.zero <= c && c <= C.nine;
}

export function is_alnum(c: number): boolean {
	return is_alpha(c) || is_digit(c);
}

export function unreachable(): never {
	throw new Error("Unreachable switch reached!");
}

export function is_hex_digit(c: number): boolean {
	if (is_digit(c)) {
		return true;
	}
	c |= 0x20;
	return C.a <= c && c <= C.f;
}

export function hex_to_int(c: number): number {
	if (is_digit(c)) {
		return c - C.zero;
	}
	c |= 0x20;
	if (C.a <= c && c <= C.f) {
		return c - C.a + 10;
	}
	return 16;
}

declare class TextEncoder {
	encode(text: string): Uint8Array;
}

declare class TextDecoder {
	constructor(encoding?: string, options?: { fatal: boolean });
	decode(bytes: Uint8Array): string;
}

export const encode = (text: string) => new TextEncoder().encode(text);
export const decode = (bytes: Uint8Array, encoding?: string, options?: { fatal: boolean }) =>
	new TextDecoder(encoding, options).decode(bytes);

export function decode_html_entity(source: Uint8Array, offset: number): { res: number; end_pos: number } {
	if (source[offset] !== C.ampersand) throw new Error("Expected &");

	let end_pos = offset + 1;
	let res = 0;
	if (source[end_pos] === C.hash) {
		end_pos++;
		if (source[end_pos] === C.x) {
			end_pos++;
			while (is_hex_digit(source[end_pos])) {
				res = res * 16 + hex_to_int(source[end_pos++]);
			}
		} else {
			while (is_digit(source[end_pos])) {
				res = res * 10 + source[end_pos++] - C.zero;
			}
		}
		if (res === 0 || res >= 0x10ffff || end_pos - offset >= 10) {
			return { res: 0, end_pos };
		}
	} else {
		while (is_alpha(source[end_pos])) {
			end_pos++;
		}
		let entity = decode(source.slice(offset + 1, end_pos));
		if (entity === "lt") {
			res = C.less_than;
		} else if (entity === "gt") {
			res = C.greater_than;
		} else if (entity === "amp") {
			res = C.ampersand;
		} else if (entity === "quot") {
			res = C.double_quote;
		} else {
			return { res: 0, end_pos };
		}
	}

	if (source[end_pos] === C.semicolon) {
		end_pos++;
	}

	return { res, end_pos };
}

export function to_lower(source: Uint8Array): Uint8Array {
	return encode(decode(source).toLowerCase());
}

export function append_utf8_character_unsafe(array: Uint8Array, pos: number, code: number): number {
	if (code <= 0x7f) {
		array[pos++] = code;
	} else if (code <= 0x7ff) {
		array[pos++] = 0xc0 | (code >> 6);
		array[pos++] = 0x80 | (code & 0x3f);
	} else if (code <= 0xffff) {
		array[pos++] = 0xe0 | (code >> 12);
		array[pos++] = 0x80 | ((code >> 6) & 0x3f);
		array[pos++] = 0x80 | (code & 0x3f);
	} else {
		array[pos++] = 0xf0 | (code >> 18);
		array[pos++] = 0x80 | ((code >> 12) & 0x3f);
		array[pos++] = 0x80 | ((code >> 6) & 0x3f);
		array[pos++] = 0x80 | (code & 0x3f);
	}
	return pos;
}
