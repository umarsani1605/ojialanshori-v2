/**
 * Helper untuk TanStack Table columns yang dipakai Nuxt UI UTable.
 * Mengurangi boilerplate `resolveComponent` + `h()` di tiap page admin.
 */
import { UBadge, UButton, UIcon } from "#components";
import { h } from "vue";
import type { Ref } from "vue";
import type { TableColumn } from "@nuxt/ui";

type AnyRow = Record<string, unknown>;
type TableSortState = Array<{ id: string; desc: boolean }>;

export function sortableHeader(options: {
  label: string;
  id: string;
  sorting: Ref<TableSortState>;
  onToggle: (id: string) => void;
}) {
  return () => {
    const active = options.sorting.value[0];
    const isActive = active?.id === options.id;
    const icon = isActive
      ? active.desc
        ? "i-ph-caret-down"
        : "i-ph-caret-up"
      : "i-ph-caret-up-down";

    return h(
      UButton,
      {
        variant: "ghost",
        color: "neutral",
        class:
          "-mx-2 inline-flex px-2 font-semibold text-highlighted hover:bg-elevated",
        onClick: () => options.onToggle(options.id),
      },
      {
        default: () => [
          h("span", options.label),
          h(UIcon, { name: icon, class: "size-4" }),
        ],
      },
    );
  };
}

/**
 * Kolom aksi "Edit + Hapus" standar di kanan tabel.
 */
export function actionsColumn<T extends AnyRow>(options: {
  /** Klik Edit memanggil callback (mode modal). Mutually exclusive dgn `editTo`. */
  onEdit?: (row: T) => void;
  /** Edit jadi NuxtLink ke URL (mode navigasi). Mutually exclusive dgn `onEdit`. */
  editTo?: (row: T) => string;
  onDelete?: (row: T) => void;
  editLabel?: string;
  deleteLabel?: string;
  extra?: (row: T) => ReturnType<typeof h>[];
}): TableColumn<T> {
  return {
    id: "actions",
    size: 180,
    minSize: 180,
    maxSize: 180,
    meta: {
      class: {
        th: "w-[180px] text-right",
        td: "w-[180px] align-top",
      },
    },
    cell: ({ row }) => {
      const children: ReturnType<typeof h>[] = [];

      if (options.extra) children.push(...options.extra(row.original));

      if (options.onEdit) {
        children.push(
          h(UButton, {
            variant: "light",
            icon: "i-ph-pencil-simple",
            onClick: () => options.onEdit!(row.original),
          }),
        );
      } else if (options.editTo) {
        children.push(
          h(UButton, {
            variant: "light",
            icon: "i-ph-pencil-simple",
            to: options.editTo(row.original),
          }),
        );
      }
      if (options.onDelete) {
        children.push(
          h(UButton, {
            variant: "light",
            color: "error",
            icon: "i-ph-trash",
            onClick: () => options.onDelete!(row.original),
          }),
        );
      }

      return h(
        "div",
        { class: "flex justify-end gap-1 whitespace-nowrap" },
        children,
      );
    },
  };
}

/**
 * Kolom gambar dengan fallback icon kalau src null.
 */
export function imageColumn<T extends AnyRow>(options: {
  accessorKey: keyof T & string;
  header?: string;
  alt: (row: T) => string;
  fallbackIcon?: string;
  shape?: "rect" | "circle" | "square";
  size?: number;
}): TableColumn<T> {
  const shape = options.shape ?? "rect";
  const fallbackIcon = options.fallbackIcon ?? "i-ph-image";

  const wrapperClass =
    shape === "circle"
      ? "size-16 rounded-full object-cover bg-elevated shrink-0"
      : shape === "square"
        ? "size-16 rounded-xl object-cover bg-elevated shrink-0"
        : "w-32 aspect-4/3 rounded-xl object-cover bg-elevated shrink-0";

  const fallbackWrapperClass = wrapperClass.replace(
    "object-cover",
    "flex items-center justify-center",
  );

  return {
    accessorKey: options.accessorKey,
    header: options.header ?? "Foto",
    size: shape === "rect" ? 152 : 88,
    minSize: shape === "rect" ? 152 : 88,
    maxSize: shape === "rect" ? 152 : 88,
    meta: {
      class: {
        th: shape === "rect" ? "w-[152px]" : "w-[88px]",
        td: shape === "rect" ? "w-[152px] align-top" : "w-[88px] align-top",
      },
    },
    cell: ({ row }) => {
      const src = row.getValue(options.accessorKey) as string | null;
      if (!src) {
        return h("div", { class: fallbackWrapperClass }, [
          h(UIcon, { name: fallbackIcon, class: "size-5 text-dimmed" }),
        ]);
      }
      return h("img", {
        src,
        alt: options.alt(row.original),
        class: wrapperClass,
      });
    },
  };
}

/**
 * Kolom badge status dengan mapping color + label.
 */
export function badgeColumn<T extends AnyRow, V extends string>(options: {
  accessorKey: keyof T & string;
  header?: TableColumn<T>["header"];
  colorMap: Record<
    V,
    "success" | "warning" | "neutral" | "error" | "info" | "primary"
  >;
  labelMap: Record<V, string>;
}): TableColumn<T> {
  return {
    accessorKey: options.accessorKey,
    header: options.header ?? "Status",
    meta: {
      class: {
        td: "align-top",
      },
    },
    cell: ({ row }) => {
      const value = row.original[options.accessorKey] as V | null | undefined;
      const label = value ? (options.labelMap[value] ?? String(value)) : "—";

      return h(
        UBadge,
        {
          color: value ? (options.colorMap[value] ?? "neutral") : "neutral",
          variant: "subtle",
        },
        () => label,
      );
    },
  };
}
