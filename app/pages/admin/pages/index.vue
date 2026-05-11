<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Halaman Publik',
})

type PageItem = {
  id: number;
  title: string;
  template: string;
  updatedAt: string;
};
const { data } = useFetch<{ data: PageItem[] }>("/api/pages");
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
