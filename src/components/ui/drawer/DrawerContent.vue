<script lang="ts" setup>
import type { DialogContentEmits, DialogContentProps } from 'radix-vue';
import type { HtmlHTMLAttributes } from 'vue';
import { cn } from '@/utils';
import { useForwardPropsEmits } from 'radix-vue';
import { DrawerContent, DrawerPortal } from 'vaul-vue';
import DrawerOverlay from './DrawerOverlay.vue';

const props = defineProps<DialogContentProps & { class?: HtmlHTMLAttributes['class'] }>();
const emits = defineEmits<DialogContentEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
    <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent
            v-bind="forwarded"
            :class="
                cn(
                    'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
                    props.class,
                )
            "
        >
            <div class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-slate-100 dark:bg-slate-800" />
            <slot />
        </DrawerContent>
    </DrawerPortal>
</template>
