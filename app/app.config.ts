export default defineAppConfig({
  ui: {
    colors: {
      primary: "brand",
      neutral: "neutral",
    },
    container: {
      base: "w-full max-w-(--ui-container) mx-auto px-6 md:px-8 lg:px-10",
    },
    alert: {
      slots: {
        root: ["gap-4 rounded-xl"],
        icon: ["size-8"],
      },
    },
    card: {
      slots: {
        root: ["rounded-xl shadow-subtle"],
        header: ["p-6! pb-0! border-none"],
        body: ["border-none"],
        footer: ["pt-0! border-none"],
      },
    },
    table: {
      slots: {
        root: ["p-px!"],
        base: ["outline outline-default rounded-lg overflow-auto"],
        separator: ["bg-gray-200"],
      },
    },
    tabs: {
      slots: {
        root: ["gap-6"],
        trigger: ["cursor-pointer shrink-0"],
        label: ["whitespace-nowrap"],
      },
      compoundVariants: [
        {
          orientation: "horizontal",
          variant: "link",
          class: {
            list: "overflow-x-auto scrollbar-none",
            indicator: "bottom-0",
          },
        },
      ],
    },
    item: {
      slots: {
        base: ["transition-colors"],
      },
    },
    button: {
      slots: {
        base: ["cursor-pointer rounded-lg"],
      },
      variants: {
        variant: {
          solid: "shadow inset-shadow-white/15 inset-shadow-2xs",
          light: "bg-white border border-slate-200",
        },
      },
      compoundVariants: [
        {
          color: "primary",
          variant: "solid",
          class: "ring ring-primary hover:bg-primary/85",
        },
        {
          color: "success",
          variant: "solid",
          class: "ring ring-success hover:bg-success/85",
        },
        {
          color: "error",
          variant: "solid",
          class: "ring ring-error hover:bg-error/85",
        },
        {
          color: "info",
          variant: "solid",
          class: "ring ring-info hover:bg-info/85",
        },
        {
          color: "warning",
          variant: "solid",
          class: "hover:bg-warning/85",
        },
        {
          color: "primary",
          variant: "ghost",
          class: "text-slate-500 hover:text-primary hover:bg-primary-50",
        },
        {
          color: "neutral",
          variant: "ghost",
          class: "text-slate-500 hover:text-neutral hover:bg-slate-50",
        },
        {
          color: "success",
          variant: "ghost",
          class: "text-slate-500 hover:text-success hover:bg-success-50",
        },
        {
          color: "warning",
          variant: "ghost",
          class: "text-slate-500 hover:text-warning hover:bg-warning-50",
        },
        {
          color: "error",
          variant: "ghost",
          class: "text-slate-500 hover:text-error hover:bg-error-50",
        },
        {
          color: "info",
          variant: "ghost",
          class: "text-slate-500 hover:text-info hover:bg-info-50",
        },
        {
          color: "primary",
          variant: "light",
          class:
            "text-slate-500 hover:text-primary hover:bg-primary-50 hover:border-primary-100",
        },
        {
          color: "neutral",
          variant: "light",
          class:
            "text-slate-500 hover:text-neutral hover:bg-slate-50 hover:border-slate-100",
        },
        {
          color: "success",
          variant: "light",
          class:
            "text-slate-500 hover:text-success hover:bg-success-50 hover:border-success-100",
        },
        {
          color: "warning",
          variant: "light",
          class:
            "text-slate-500 hover:text-warning hover:bg-warning-50 hover:border-warning-100",
        },
        {
          color: "error",
          variant: "light",
          class:
            "text-slate-500 hover:text-error hover:bg-error-50 hover:border-error-100",
        },
        {
          color: "info",
          variant: "light",
          class:
            "text-slate-500 hover:text-info hover:bg-info-50 hover:border-info-100",
        },
      ],
    },
    editor: {
      slots: {
        base: "px-2!",
      },
    },
    formField: {
      slots: {
        labelWrapper: ["block"],
      },
      variants: {
        orientation: {
          vertical: {
            container: "mt-3",
          },
        },
      },
    },
    modal: {
      variants: {
        overlay: {
          true: {
            overlay: "bg-black/50",
          },
        },
      },
    },
    toast: {
      variants: {
        color: {
          primary: {
            root: "bg-[#E9F2FF] text-primary ring-inset ring-primary/25",
          },
          success: {
            root: "bg-[#E9F8F0] text-success ring-inset ring-success/25",
          },
          info: {
            root: "bg-[#E9F2FF] text-info ring-inset ring-info/25",
          },
          warning: {
            root: "bg-[#FDF7E8] text-warning ring-inset ring-warning/25",
          },
          error: {
            root: "bg-[#FEEBED] text-error ring-inset ring-error/25",
          },
          neutral: {
            root: "bg-[#F7FAFC] text-neutral ring-inset ring-neutral/25",
          },
        },
      },
    },
    switch: {
      slots: {
        base: ["cursor-pointer"],
      },
    },
    input: {
      slots: {
        base: [
          "transition duration-300 ease-in-out rounded-lg disabled:bg-muted disabled:text-slate-700 read-only:bg-muted read-only:text-slate-600",
        ],
      },
      compoundVariants: [
        {
          color: "primary",
          variant: ["outline", "subtle"],
          class: "focus-visible:ring-1 ring-slate-200",
        },
        {
          color: "neutral",
          variant: ["outline", "subtle"],
          class: "focus-visible:ring-1 ring-slate-200",
        },
      ],
      defaultVariants: {
        size: "lg",
      },
    },
    inputTags: {
      slots: {
        base: [
          "transition duration-300 ease-in-out rounded-lg disabled:bg-muted disabled:text-gray-700 read-only:text-gray-600",
        ],
      },
      compoundVariants: [
        {
          color: "primary",
          variant: ["outline", "subtle"],
          class: "has-focus-visible:ring-1 ring-slate-200",
        },
        {
          color: "neutral",
          variant: ["outline", "subtle"],
          class: "has-focus-visible:ring-1 ring-slate-200",
        },
      ],
      defaultVariants: {
        size: "lg",
      },
    },
    textarea: {
      slots: {
        base: [
          "transition duration-300 ease-in-out rounded-lg disabled:bg-muted disabled:text-slate-600 read-only:bg-muted read-only:text-slate-600",
        ],
      },
      compoundVariants: [
        {
          color: "primary",
          variant: ["outline", "subtle"],
          class: "focus-visible:ring-1 ring-slate-200",
        },
        {
          color: "neutral",
          variant: ["outline", "subtle"],
          class: "focus-visible:ring-1 ring-slate-200",
        },
      ],
      defaultVariants: {
        size: "lg",
      },
    },
    select: {
      slots: {
        base: ["cursor-pointer rounded-lg"],
        item: ["cursor-pointer"],
      },
      compoundVariants: [
        {
          color: "primary",
          variant: ["outline", "subtle"],
          class: "text-slate-600 focus:ring-1 ring-slate-200",
        },
        {
          color: "neutral",
          variant: ["outline", "subtle"],
          class: "text-slate-600 focus:ring-1 ring-slate-200",
        },
      ],
      defaultVariants: {
        size: "lg",
      },
    },
    navigationMenu: {
      variants: {
        orientation: {
          vertical: {
            list: "flex flex-col gap-1.5!",
            link: "px-3 py-2",
          },
        },
      },
      compoundVariants: [
        {
          color: "primary",
          variant: "pill",
          active: true,
          highlight: false,
          class: {
            link: "before:bg-primary-50",
          },
        },
      ],
    },
    selectMenu: {
      slots: {
        base: ["cursor-pointer rounded-lg"],
        item: ["cursor-pointer"],
      },
      compoundVariants: [
        {
          color: "primary",
          variant: ["outline", "subtle"],
          class: "text-slate-600 focus:ring-1 ring-slate-200",
        },
        {
          color: "neutral",
          variant: ["outline", "subtle"],
          class: "text-slate-600 focus:ring-1 ring-slate-200",
        },
      ],
      defaultVariants: {
        size: "lg",
      },
    },
    popover: {
      slots: {
        content: ["shadow-xs"],
        arrow: ["fill-primary"],
      },
    },
    empty: {
      slots: {
        root: ["p-8 sm:p-10 lg:p-16"],
        header: ["gap-4"],
        description: ["text-dimmed!"],
      },
    },
    carousel: {
      slots: {
        dot: [
          "cursor-pointer size-2 bg-slate-300 rounded-full",
          "transition-all",
          "data-[state=active]:bg-primary-500",
        ],
      },
    },
  },
});
