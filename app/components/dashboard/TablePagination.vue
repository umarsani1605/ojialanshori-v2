<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    page: number;
    total: number;
    pageSize?: number;
  }>(),
  {
    pageSize: 10,
  },
);

defineEmits<{
  "update:page": [value: number];
}>();

const start = computed(() =>
  props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1,
);
const end = computed(() => Math.min(props.page * props.pageSize, props.total));
</script>

<template>
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1 mt-auto"
  >
    <p class="text-sm text-muted shrink-0">
      Menampilkan {{ start }} hingga {{ end }} dari {{ total }} data
    </p>
    <UPagination
      :page="page"
      :items-per-page="pageSize"
      :total="total"
      size="sm"
      variant="ghost"
      @update:page="(p: number) => $emit('update:page', p)"
    />
  </div>
</template>
