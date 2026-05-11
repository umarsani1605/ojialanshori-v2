<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { PageDto as PageItem } from "~~/shared/types";

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Halaman Publik',
})
const { data } = useLazyFetch<{ data: PageItem[] }>("/api/pages", {
  key: "admin-pages-list",
});
const pages = computed(() => data.value?.data ?? []);

const UButton = resolveComponent("UButton");

const columns: TableColumn<PageItem>[] = [
  {
    accessorKey: "title",
    header: "Halaman",
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.title),
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) =>
      h("div", { class: "flex justify-end" }, [
        h(
          UButton,
          {
            size: "sm",
            color: "neutral",
            variant: "light",
            icon: "i-ph-pencil-simple",
            to: `/admin/pages/${row.original.template}`,
          },
          () => "Edit",
        ),
      ]),
  },
];
</script>

<template>
  <AdminDataTable :data="pages" :columns="columns" :index-column-size="44" />
</template>
