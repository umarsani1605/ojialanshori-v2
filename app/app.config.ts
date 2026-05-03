export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'neutral'
    },
    alert: {
      slots: {
        root: ['gap-4 rounded-xl'],
        icon: ['size-8']
      }
    },
    card: {
      slots: {
        root: ['rounded-xl'],
        header: ['border-none'],
        footer: ['border-none']
      }
    },
    tabs: {
      slots: {
        trigger: ['cursor-pointer shrink-0'],
        label: ['whitespace-nowrap']
      },
      compoundVariants: [
        {
          orientation: 'horizontal',
          variant: 'link',
          class: {
            list: 'overflow-x-auto scrollbar-none',
            indicator: 'bottom-0'
          }
        }
      ]
    },
    item: {
      slots: {
        base: ['transition-colors']
      }
    },
    button: {
      slots: {
        base: ['cursor-pointer rounded-lg']
      },
      variants: {
        variant: {
          solid: 'shadow inset-shadow-white/15 inset-shadow-2xs',
          light: 'bg-white dark:bg-neutral-800 border border-default'
        }
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: 'ring ring-primary hover:bg-primary/85'
        },
        {
          color: 'success',
          variant: 'solid',
          class: 'ring ring-success hover:bg-success/85'
        },
        {
          color: 'error',
          variant: 'solid',
          class: 'ring ring-error hover:bg-error/85'
        },
        {
          color: 'info',
          variant: 'solid',
          class: 'ring ring-info hover:bg-info/85'
        },
        {
          color: 'warning',
          variant: 'solid',
          class: 'hover:bg-warning/85'
        },
        {
          color: 'primary',
          variant: 'ghost',
          class: 'text-neutral-500 hover:text-primary hover:bg-primary-50'
        },
        {
          color: 'neutral',
          variant: 'ghost',
          class: 'text-neutral-500 hover:text-neutral hover:bg-neutral-50'
        },
        {
          color: 'success',
          variant: 'ghost',
          class: 'text-neutral-500 hover:text-success hover:bg-success-50'
        },
        {
          color: 'warning',
          variant: 'ghost',
          class: 'text-neutral-500 hover:text-warning hover:bg-warning-50'
        },
        {
          color: 'error',
          variant: 'ghost',
          class: 'text-neutral-500 hover:text-error hover:bg-error-50'
        },
        {
          color: 'info',
          variant: 'ghost',
          class: 'text-neutral-500 hover:text-info hover:bg-info-50'
        },
        {
          color: 'primary',
          variant: 'light',
          class: 'text-neutral-500 hover:text-primary hover:bg-primary-50 hover:border-primary-100'
        },
        {
          color: 'neutral',
          variant: 'light',
          class: 'text-neutral-500 hover:text-neutral hover:bg-neutral-50 hover:border-neutral-100'
        },
        {
          color: 'success',
          variant: 'light',
          class: 'text-neutral-500 hover:text-success hover:bg-success-50 hover:border-success-100'
        },
        {
          color: 'warning',
          variant: 'light',
          class: 'text-neutral-500 hover:text-warning hover:bg-warning-50 hover:border-warning-100'
        },
        {
          color: 'error',
          variant: 'light',
          class: 'text-neutral-500 hover:text-error hover:bg-error-50 hover:border-error-100'
        },
        {
          color: 'info',
          variant: 'light',
          class: 'text-neutral-500 hover:text-info hover:bg-info-50 hover:border-info-100'
        }
      ]
    },
    formField: {
      slots: {
        labelWrapper: ['block']
      },
      variants: {
        orientation: {
          vertical: {
            container: 'mt-3'
          }
        }
      }
    },
    modal: {
      variants: {
        overlay: {
          true: {
            overlay: 'bg-black/50'
          }
        }
      }
    },
    toast: {
      variants: {
        color: {
          primary: {
            root: 'bg-[#E9F2FF] dark:bg-primary-950/50 dark:backdrop-blur-xl dark:border dark:border-primary-800/30 text-primary ring-inset ring-primary/25'
          },
          success: {
            root: 'bg-[#E9F8F0] dark:bg-success-950/50 dark:backdrop-blur-xl dark:border dark:border-success-800/30 text-success ring-inset ring-success/25'
          },
          info: {
            root: 'bg-[#E9F2FF] dark:bg-info-950/50 dark:backdrop-blur-xl dark:border dark:border-info-800/30 text-info ring-inset ring-info/25'
          },
          warning: {
            root: 'bg-[#FDF7E8] dark:bg-warning-950/50 dark:backdrop-blur-xl dark:border dark:border-warning-800/30 text-warning ring-inset ring-warning/25'
          },
          error: {
            root: 'bg-[#FEEBED] dark:bg-error-950/50 dark:backdrop-blur-xl dark:border dark:border-error-800/30 text-error ring-inset ring-error/25'
          },
          neutral: {
            root: 'bg-[#F7FAFC] dark:bg-neutral-800/50 dark:backdrop-blur-xl dark:border dark:border-neutral-700/30 text-neutral ring-inset ring-neutral/25'
          }
        }
      }
    },
    switch: {
      slots: {
        base: ['cursor-pointer']
      }
    },
    input: {
      slots: {
        base: [
          'transition duration-300 ease-in-out rounded-lg disabled:bg-muted disabled:text-neutral-700 dark:disabled:text-neutral-300 read-only:bg-muted read-only:text-neutral-600 dark:read-only:text-neutral-400'
        ]
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: ['outline', 'subtle'],
          class: 'focus-visible:ring-1 ring-neutral-200 dark:ring-neutral-700'
        },
        {
          color: 'neutral',
          variant: ['outline', 'subtle'],
          class: 'focus-visible:ring-1 ring-neutral-200 dark:ring-neutral-700'
        }
      ],
      defaultVariants: {
        size: 'lg'
      }
    },
    textarea: {
      slots: {
        base: [
          'transition duration-300 ease-in-out rounded-lg disabled:bg-muted disabled:text-neutral-600 dark:disabled:text-neutral-400 read-only:bg-muted read-only:text-neutral-600 dark:read-only:text-neutral-400'
        ]
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: ['outline', 'subtle'],
          class: 'focus-visible:ring-1 ring-neutral-200 dark:ring-neutral-700'
        },
        {
          color: 'neutral',
          variant: ['outline', 'subtle'],
          class: 'focus-visible:ring-1 ring-neutral-200 dark:ring-neutral-700'
        }
      ],
      defaultVariants: {
        size: 'lg'
      }
    },
    select: {
      slots: {
        base: ['cursor-pointer rounded-lg'],
        item: ['cursor-pointer']
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: ['outline', 'subtle'],
          class: 'text-neutral-600 dark:text-neutral-300 focus:ring-1 ring-neutral-200 dark:ring-neutral-700'
        },
        {
          color: 'neutral',
          variant: ['outline', 'subtle'],
          class: 'text-neutral-600 dark:text-neutral-300 focus:ring-1 ring-neutral-200 dark:ring-neutral-700'
        }
      ],
      defaultVariants: {
        size: 'lg'
      }
    },
    selectMenu: {
      slots: {
        base: ['cursor-pointer rounded-lg'],
        item: ['cursor-pointer']
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: ['outline', 'subtle'],
          class: 'text-neutral-600 dark:text-neutral-300 focus:ring-1 ring-neutral-200 dark:ring-neutral-700'
        },
        {
          color: 'neutral',
          variant: ['outline', 'subtle'],
          class: 'text-neutral-600 dark:text-neutral-300 focus:ring-1 ring-neutral-200 dark:ring-neutral-700'
        }
      ],
      defaultVariants: {
        size: 'lg'
      }
    },
    popover: {
      slots: {
        content: ['shadow-xs'],
        arrow: ['fill-primary']
      }
    },
    empty: {
      slots: {
        root: ['p-8 sm:p-10 lg:p-16'],
        header: ['gap-4'],
        description: ['text-dimmed!']
      }
    }
  }
})
