<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <div
        :class="
            cn(
                'rounded-xl border border-slate-200 bg-white text-slate-950 shadow dark:border-slate-800 dark:bg-card dark:text-slate-50',
                props.class,
            )
        "
    >
        <slot />
    </div>
</template>
