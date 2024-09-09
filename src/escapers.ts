import type { Escaper } from "./types.ts";

/**
 * Escapes HTML special characters.
 *
 * Borrowed from https://github.com/feathers-studio/hyperactive/blob/bbd67beace6744c4b8b48637a96c2daed416ebde/hyper/util.ts
 */
export const escapeHtml: Escaper = (() => {
  const escapables = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
  };

  const toEscape = /<|>|&/g;

  return (s) =>
    s.replace(toEscape, (r) => escapables[r as keyof typeof escapables] || r);
})();

/**
 * Escapes MarkdownV2 special characters.
 */
export const escapeMarkdownV2: Escaper = (() => {
  const escapables = {
    "_": "\\_",
    "*": "\\*",
    "[": "\\[",
    "]": "\\]",
    "(": "\\(",
    ")": "\\)",
    "~": "\\~",
    "`": "\\`",
    ">": "\\>",
    "#": "\\#",
    "+": "\\+",
    "-": "\\-",
    "=": "\\=",
    "|": "\\|",
    "{": "\\{",
    "}": "\\}",
    ".": "\\.",
    "!": "\\!",
  };

  const toEscape = new RegExp(
    "[" + Object.values(escapables).join("") + "]",
    "g",
  );

  return (s) =>
    s.replace(toEscape, (r) => escapables[r as keyof typeof escapables] || r);
})();
