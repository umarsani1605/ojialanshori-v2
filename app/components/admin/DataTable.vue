<script setup lang="ts" generic="T">
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";

const props = withDefaults(
  defineProps<{
    data: T[];
    columns: TableColumn<T>[];
    search?: string;
    searchPlaceholder?: string;
    loading?: boolean;
    showIndex?: boolean;
    indexColumnSize?: number;
    defaultPageSize?: number;
    card?: boolean;
    paginated?: boolean;
  }>(),
  {
    search: undefined,
    searchPlaceholder: "Cari...",
    loading: false,
    showIndex: true,
    indexColumnSize: 56,
    defaultPageSize: 10,
    card: true,
    paginated: true,
  },
);

const cardClass = computed(() =>
  props.card
    ? "flex flex-col min-h-[850px] overflow-auto"
    : "flex flex-col",
);

const cardUi = computed(() =>
  props.card
    ? { body: "flex-1", footer: "mt-auto" }
    : {
        root: "border-0 ring-0 rounded-none shadow-none bg-transparent",
        header: "!px-0 !pt-0 !pb-4 sm:!px-0 sm:!pt-0 sm:!pb-4 !border-0",
        body: "!p-0 sm:!p-0 flex-1",
        footer: "!px-0 !pb-0 !pt-4 sm:!px-0 sm:!pb-0 sm:!pt-4 !border-0 mt-auto",
      },
);

const emit = defineEmits<{
  "update:search": [value: string];
}>();

defineOptions({ inheritAttrs: false });

const table = useTemplateRef("table");

const pagination = ref({
  pageIndex: 0,
  pageSize: props.defaultPageSize,
});

const paginatedData = computed(() => {
  if (!props.paginated) return props.data;
  const start = pagination.value.pageIndex * pagination.value.pageSize;
  return props.data.slice(start, start + pagination.value.pageSize);
});

const displayColumns = computed<TableColumn<T>[]>(() => {
  if (!props.showIndex) {
    return props.columns;
  }

  return [
    {
      id: "index",
      header: "No",
      size: props.indexColumnSize,
      minSize: props.indexColumnSize,
      maxSize: props.indexColumnSize,
      meta: {
        class: {
          td: "align-top",
        },
        style: {
          th: {
            width: `${props.indexColumnSize}px`,
            minWidth: `${props.indexColumnSize}px`,
            maxWidth: `${props.indexColumnSize}px`,
          },
          td: {
            width: `${props.indexColumnSize}px`,
            minWidth: `${props.indexColumnSize}px`,
            maxWidth: `${props.indexColumnSize}px`,
          },
        },
      },
      cell: ({ row }) =>
        h(
          "span",
          { class: "text-sm tabular-nums text-muted" },
          String(
            pagination.value.pageIndex * pagination.value.pageSize +
              row.index +
              1,
          ),
        ),
    } as TableColumn<T>,
    ...props.columns,
  ];
});

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
  <UCard :class="cardClass" :ui="cardUi">
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
        :data="paginatedData"
        :columns="displayColumns"
        :loading="loading"
        :ui="{
          base: 'min-w-full table-fixed',
          tbody: '[&>tr]:hover:bg-elevated/50 [&>tr]:transition-colors',
          td: 'align-top',
        }"
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

    <template v-if="paginated || $slots.footer" #footer>
      <slot name="footer" :pagination="pagination" />
      <div
        v-if="!$slots.footer && paginated"
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
