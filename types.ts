import type { MessageEntity } from "https://deno.land/x/telegraf_types@v7.0.1/message.ts";

export type { MessageEntity };

export interface TextMessage {
	text: string;
	entities?: MessageEntity[];
}

export interface CaptionedMedia {
	caption?: string;
	caption_entities?: MessageEntity[];
}

export type Message = TextMessage | CaptionedMedia;

export type Leaf = string;
export type Node = MessageEntity & { text: string; children: Tree };
export type Tree = (Node | Leaf)[];

export type Serialiser = (match: string, entity?: Node) => string;
export type Escaper = (match: string) => string;
