<script setup lang="ts">
import type { TabsContentProps } from 'radix-vue';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';
import { TabsContent } from 'radix-vue';
import { computed } from 'vue';

const props = defineProps<TabsContentProps & { class?: HTMLAttributes['class'] }>();

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props;

    return delegated;
});
</script>

<template>
    <TabsContent
        :class="
            cn(
                'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300',
                props.class,
            )
        "
        v-bind="delegatedProps"
    >
        <slot />
    </TabsContent>
</template>
