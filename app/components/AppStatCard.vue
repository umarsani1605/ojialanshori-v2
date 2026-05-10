<script setup lang="ts">
type Color = "blue" | "green" | "amber" | "red" | "slate" | "purple" | "orange";

withDefaults(defineProps<{
  label: string;
  value: number | string;
  icon: string;
  color: Color;
  wrap?: boolean;
}>(), {
  wrap: true,
});

const bgClass: Record<Color, string> = {
  blue: "bg-blue-50 dark:bg-blue-950/50",
  green: "bg-green-50 dark:bg-green-950/50",
  amber: "bg-amber-50 dark:bg-amber-950/50",
  red: "bg-red-50 dark:bg-red-950/50",
  slate: "bg-slate-50 dark:bg-slate-900/50",
  purple: "bg-purple-50 dark:bg-purple-950/50",
  orange: "bg-orange-50 dark:bg-orange-950/50",
};

const iconClass: Record<Color, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  slate: "text-slate-600 dark:text-slate-400",
  purple: "text-purple-600 dark:text-purple-400",
  orange: "text-orange-600 dark:text-orange-400",
};
</script>

<template>
  <UCard :ui="{
    body: 'p-4!',
  }">
    <div
      :class="wrap ? 'flex flex-col md:flex-row items-start md:items-center gap-6' : 'flex flex-row items-center gap-6'">
      <div :class="[
        bgClass[color],
        'size-12 rounded-lg flex items-center justify-center shrink-0',
      ]">
        <UIcon :name="icon" :class="['size-6', iconClass[color]]" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm text-muted truncate">{{ label }}</p>
        <p class="mt-0.5 text-2xl font-bold truncate">{{ value }}</p>
      </div>
    </div>
  </UCard>
</template>
