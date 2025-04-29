<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';

const props = defineProps<{
    class?: HTMLAttributes['class'];
}>();
</script>

<template>
    <div class="relative w-full overflow-auto">
        <table :class="cn('w-full caption-bottom text-sm bg-card rounded-md border border-1', props.class)">
            <slot />
        </table>
    </div>
</template>
