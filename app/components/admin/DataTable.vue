<script setup lang="ts" generic="T">
import { getPaginationRowModel } from "@tanstack/table-core";
import type { TableColumn } from "@nuxt/ui";
import type { PaginationState } from "@tanstack/table-core";

const props = withDefaults(
  defineProps<{
    data: T[];
    columns: TableColumn<T>[];
    search?: string;
    searchPlaceholder?: string;
    loading?: boolean;
  }>(),
  {
    search: undefined,
    searchPlaceholder: "Cari...",
    loading: false,
  },
);

const emit = defineEmits<{
  "update:search": [value: string];
}>();

defineOptions({ inheritAttrs: false });

const table = useTemplateRef("table");

const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 });

const paginationRowModel = getPaginationRowModel();

const slots = useSlots();
const forwardedSlots = computed(() =>
  Object.fromEntries(
    Object.entries(slots).filter(
      ([name]) =>
        !["toolbar", "toolbar-left", "toolbar-right", "footer"].includes(name),
    ),
  ),
);

const start = computed(() =>
  props.data.length === 0
    ? 0
    : pagination.value.pageIndex * pagination.value.pageSize + 1,
);
const end = computed(() =>
  Math.min(
    (pagination.value.pageIndex + 1) * pagination.value.pageSize,
    props.data.length,
  ),
);

watch(
  () => props.data,
  () => {
    pagination.value = { ...pagination.value, pageIndex: 0 };
  },
);

defineExpose({
  tableApi: computed(() => (table.value as any)?.tableApi),
  pagination,
});
</script>

<template>
  <UCard
    class="shadow-none!"
    :ui="{
      root: 'ring-transparent divide-y divide-default overflow-hidden',
      header: 'px-4 py-3 pb-0',
      footer: 'px-4 py-3',
    }"
  >
    <template
      v-if="
        $slots.toolbar ||
        $slots['toolbar-left'] ||
        $slots['toolbar-right'] ||
        search !== undefined
      "
      #header
    >
      <slot v-if="$slots.toolbar" name="toolbar" />
      <div v-else class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-if="search !== undefined"
            :model-value="search"
            icon="i-ph-magnifying-glass-bold"
            :placeholder="searchPlaceholder"
            class="w-full sm:w-56"
            @update:model-value="emit('update:search', String($event))"
          />
          <slot name="toolbar-left" />
        </div>
        <slot name="toolbar-right" />
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable
        ref="table"
        v-model:pagination="pagination"
        :pagination-options="{ getPaginationRowModel: paginationRowModel }"
        :data="data"
        :columns="columns"
        :loading="loading"
        :ui="{ tbody: '[&>tr]:hover:bg-elevated/50 [&>tr]:transition-colors' }"
        v-bind="$attrs"
      >
        <template
          v-for="(_, name) in forwardedSlots"
          :key="name"
          #[name]="slotData"
        >
          <slot :name="name" v-bind="slotData ?? {}" />
        </template>
      </UTable>
    </div>

    <template #footer>
      <slot name="footer" :pagination="pagination" />
      <div
        v-if="!$slots.footer"
        class="flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <p class="text-sm text-muted shrink-0">
            Menampilkan {{ start }}–{{ end }} dari {{ data.length }} data
          </p>
          <USelect
            :model-value="pagination.pageSize"
            :items="[10, 25, 50, 100]"
            size="sm"
            class="w-20"
            @update:model-value="
              (val) => (pagination = { pageIndex: 0, pageSize: Number(val) })
            "
          />
        </div>
        <UPagination
          :page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="data.length"
          size="sm"
          variant="ghost"
          @update:page="
            (p) => (pagination = { ...pagination, pageIndex: p - 1 })
          "
        />
      </div>
    </template>
  </UCard>
</template>
