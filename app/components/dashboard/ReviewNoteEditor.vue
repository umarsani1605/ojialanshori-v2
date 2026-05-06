<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui";

defineProps<{
  modelValue: string;
  disabled?: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();

const toolbarItems: EditorToolbarItem[][] = [
  [
    { kind: "mark", mark: "bold", icon: "i-lucide-bold", tooltip: { text: "Bold" } },
    { kind: "mark", mark: "italic", icon: "i-lucide-italic", tooltip: { text: "Italic" } },
    { kind: "mark", mark: "underline", icon: "i-lucide-underline", tooltip: { text: "Underline" } },
    { kind: "mark", mark: "strike", icon: "i-lucide-strikethrough", tooltip: { text: "Strikethrough" } },
  ],
  [
    { kind: "bulletList", icon: "i-lucide-list", tooltip: { text: "Bullet List" } },
    { kind: "orderedList", icon: "i-lucide-list-ordered", tooltip: { text: "Numbered List" } },
  ],
  [
    { kind: "link", icon: "i-lucide-link", tooltip: { text: "Link" } },
  ],
];
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    :model-value="modelValue"
    :editable="!disabled"
    content-type="html"
    class="min-h-32"
    @update:model-value="$emit('update:modelValue', $event as string)"
  >
    <UEditorToolbar :editor="editor" :items="toolbarItems" />
  </UEditor>
</template>
