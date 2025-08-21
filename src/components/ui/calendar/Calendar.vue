<script lang="ts" setup>
import type { CalendarRootEmits, CalendarRootProps } from 'radix-vue';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';
import { CalendarRoot, useForwardPropsEmits } from 'radix-vue';
import { computed } from 'vue';
import {
    CalendarCell,
    CalendarCellTrigger,
    CalendarGrid,
    CalendarGridBody,
    CalendarGridHead,
    CalendarGridRow,
    CalendarHeadCell,
    CalendarHeader,
    CalendarHeading,
    CalendarNextButton,
    CalendarPrevButton,
} from '.';

const props = defineProps<
    CalendarRootProps & {
        class?: HTMLAttributes['class'];
        // ISO date strings YYYY-MM-DD to visually highlight a range
        rangeStart?: string;
        rangeEnd?: string;
    }
>();

const emits = defineEmits<CalendarRootEmits>();

const delegatedProps = computed(() => {
    const { class: _c, rangeStart: _rs, rangeEnd: _re, ...delegated } = props as any;
    return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const startIso = computed(() => props.rangeStart || '');
const endIso = computed(() => props.rangeEnd || '');

const inRangeClass = (iso: string) => {
    if (!startIso.value || !endIso.value) return '';
    if (iso >= startIso.value && iso <= endIso.value) return 'bg-accent/40 text-foreground';
    return '';
};
</script>

<template>
    <CalendarRoot v-slot="{ grid, weekDays }" :class="cn('p-3', props.class)" v-bind="forwarded">
        <CalendarHeader>
            <CalendarPrevButton />
            <CalendarHeading />
            <CalendarNextButton />
        </CalendarHeader>

        <div class="flex flex-col gap-y-4 mt-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
            <CalendarGrid v-for="month in grid" :key="month.value.toString()">
                <CalendarGridHead>
                    <CalendarGridRow>
                        <CalendarHeadCell v-for="day in weekDays" :key="day">
                            {{ day }}
                        </CalendarHeadCell>
                    </CalendarGridRow>
                </CalendarGridHead>
                <CalendarGridBody>
                    <CalendarGridRow v-for="(weekDates, index) in month.rows" :key="`weekDate-${index}`" class="mt-2 w-full">
                        <CalendarCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate">
                            <CalendarCellTrigger :day="weekDate" :month="month.value" :class="inRangeClass(weekDate.toString())" />
                        </CalendarCell>
                    </CalendarGridRow>
                </CalendarGridBody>
            </CalendarGrid>
        </div>
    </CalendarRoot>
</template>
