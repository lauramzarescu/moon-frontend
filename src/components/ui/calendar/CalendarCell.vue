<script lang="ts" setup>
import type { CalendarCellProps } from 'radix-vue';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';
import { CalendarCell, useForwardProps } from 'radix-vue';
import { computed } from 'vue';

const props = defineProps<CalendarCellProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props;

    return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
    <CalendarCell
        :class="
            cn(
                'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([data-selected])]:rounded-md [&:has([data-selected])]:bg-slate-100 [&:has([data-selected][data-outside-view])]:bg-slate-100/50 dark:[&:has([data-selected])]:bg-slate-800 dark:[&:has([data-selected][data-outside-view])]:bg-slate-800/50',
                props.class,
            )
        "
        v-bind="forwardedProps"
    >
        <slot />
    </CalendarCell>
</template>
