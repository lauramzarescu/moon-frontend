<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <tr
        :class="
            cn('border-b transition-colors hover:!bg-accent dark:hover:!bg-slate-900/70 data-[state=selected]:bg-slate-900/70', props.class)
        "
    >
        <slot />
    </tr>
</template>
