import emojiData from "emojibase-data/en/compact.json";

type EmojiDatasetItem = {
  emoticon?: string | string[];
  group?: number;
  hexcode: string;
  label: string;
  tags?: string[];
  unicode: string;
};

const EMOJI_GROUPS = [
  { id: 0, label: "Smileys & Emotion" },
  { id: 1, label: "People & Body" },
  { id: 2, label: "Animals & Nature" },
  { id: 3, label: "Food & Drink" },
  { id: 4, label: "Travel & Places" },
  { id: 5, label: "Activities" },
  { id: 6, label: "Objects" },
  { id: 7, label: "Symbols" },
  { id: 8, label: "Flags" },
  { id: 9, label: "Flags" },
] as const;

function toShortcodes(item: EmojiDatasetItem) {
  const base = item.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const emoticons = Array.isArray(item.emoticon)
    ? item.emoticon
    : item.emoticon
      ? [item.emoticon]
      : [];

  return [base, ...emoticons];
}

export const editorEmojiItems = EMOJI_GROUPS.map(({ id, label }) =>
  (emojiData as EmojiDatasetItem[])
    .filter((item) => item.group === id && item.unicode)
    .map((item) => ({
      name: item.label,
      emoji: item.unicode,
      shortcodes: toShortcodes(item),
      tags: item.tags ?? [],
      group: label,
    })),
).filter((group) => group.length > 0);
