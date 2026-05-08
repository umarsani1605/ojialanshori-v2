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
    {
      kind: "mark",
      mark: "bold",
      icon: "i-ph-text-b",
      tooltip: { text: "Bold" },
    },
    {
      kind: "mark",
      mark: "italic",
      icon: "i-ph-text-italic",
      tooltip: { text: "Italic" },
    },
    {
      kind: "mark",
      mark: "underline",
      icon: "i-ph-text-underline",
      tooltip: { text: "Underline" },
    },
    {
      kind: "mark",
      mark: "strike",
      icon: "i-ph-text-strikethrough",
      tooltip: { text: "Strikethrough" },
    },
  ],
  [
    {
      kind: "bulletList",
      icon: "i-ph-list-bullets",
      tooltip: { text: "Bullet List" },
    },
    {
      kind: "orderedList",
      icon: "i-ph-list-numbers",
      tooltip: { text: "Numbered List" },
    },
  ],
];
</script>

<template>
  <UCard>
    <template #header>
      <p class="font-medium text-sm">Catatan Review</p>
    </template>
    <UEditor
      v-slot="{ editor }"
      :model-value="modelValue"
      :editable="!disabled"
      :placeholder="{
        placeholder: 'Tambahkan catatan...',
        mode: 'firstLine',
      }"
      content-type="html"
      @update:model-value="$emit('update:modelValue', $event as string)"
      :ui="{
        root: 'min-h-[120px]',
        content: 'py-4',
        base: 'min-h-[120px] max-w-none px-2!',
      }"
    >
      <UEditorToolbar :editor="editor" :items="toolbarItems" size="md" />
    </UEditor>
    <p class="text-xs text-muted mt-2">Wajib diisi saat menolak artikel.</p>
  </UCard>
</template>
