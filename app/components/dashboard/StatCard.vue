<script setup lang="ts">
type Color = "blue" | "green" | "amber" | "red" | "slate" | "purple" | "orange";

const props = defineProps<{
  label: string;
  value: number | string;
  icon: string;
  color: Color;
}>();

const bgClass: Record<Color, string> = {
  blue: "bg-blue-100",
  green: "bg-green-100",
  amber: "bg-amber-100",
  red: "bg-red-100",
  slate: "bg-slate-100",
  purple: "bg-purple-100",
  orange: "bg-orange-100",
};

const iconClass: Record<Color, string> = {
  blue: "text-blue-400",
  green: "text-green-400",
  amber: "text-amber-400",
  red: "text-red-400",
  slate: "text-slate-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
};
</script>

<template>
  <UCard>
    <div class="flex items-center gap-6">
      <div
        :class="[
          bgClass[color],
          'size-16 rounded-xl flex items-center justify-center shrink-0',
        ]"
      >
        <UIcon :name="icon" :class="['size-10', iconClass[color]]" />
      </div>
      <div>
        <p class="text-sm text-dimmed">{{ label }}</p>
        <p class="mt-0.5 text-2xl font-semibold">{{ value }}</p>
      </div>
    </div>
  </UCard>
</template>
