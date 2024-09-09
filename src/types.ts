import type { MessageEntity } from "@grammyjs/types";

export type { MessageEntity };

/**
 * Text message with optional entities.
 */
export interface TextMessage {
  text: string;
  entities?: MessageEntity[];
}

/**
 * Media with an optional caption and its entities.
 */
export interface CaptionedMedia {
  caption?: string;
  caption_entities?: MessageEntity[];
}

/**
 * Message type, either a text message or captioned media.
 */
export type Message = TextMessage | CaptionedMedia;

/**
 * Leaf node in the entity tree.
 */
export type Leaf = string;

/**
 * Node in the entity tree, including text and children.
 */
export type Node = MessageEntity & { text: string; children: Tree };

/**
 * Tree structure of nodes and leaves.
 */
export type Tree = (Node | Leaf)[];

/**
 * Serializer function type for converting matched text based on entity.
 */
export type Serializer = (match: string, entity?: Node) => string;

/**
 * Escaper function type for escaping special characters in text.
 */
export type Escaper = (match: string) => string;
