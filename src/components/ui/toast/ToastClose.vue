<script setup lang="ts">
import type { ToastCloseProps } from 'radix-vue';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';
import { Cross2Icon } from '@radix-icons/vue';
import { ToastClose } from 'radix-vue';
import { computed } from 'vue';

const props = defineProps<
    ToastCloseProps & {
        class?: HTMLAttributes['class'];
    }
>();

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props;

    return delegated;
});
</script>

<template>
    <ToastClose
        v-bind="delegatedProps"
        :class="
            cn(
                'absolute right-1 top-1 rounded-md p-1 text-slate-950/50 opacity-0 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 dark:text-slate-50/50 dark:hover:text-slate-50',
                props.class,
            )
        "
    >
        <Cross2Icon class="h-4 w-4" />
    </ToastClose>
</template>
