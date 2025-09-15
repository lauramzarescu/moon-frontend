<template>
    <div class="relative inline-flex">
        <!-- Main Button -->
        <Button
            :variant="variant"
            :size="size"
            :disabled="disabled || loading"
            :class="cn('rounded-r-none border-r-0', buttonClass)"
            :title="title"
            @click="$emit('click')"
        >
            <slot name="icon" />
            <span v-if="loading" class="flex items-center gap-2">
                <Loader2Icon class="w-4 h-4 animate-spin" />
                {{ loadingText }}
            </span>
            <span v-else>{{ buttonText }}</span>
        </Button>

        <!-- Dropdown Button -->
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button
                    :variant="variant"
                    :size="size"
                    :disabled="disabled || loading"
                    :class="cn('rounded-l-none px-2', dropdownClass)"
                >
                    <ChevronDownIcon class="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent :align="dropdownAlign" :class="dropdownContentClass">
                <slot name="dropdown-content" />
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>

<script setup lang="ts">
import type { ButtonVariants } from '@/components/ui/button';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@radix-icons/vue';
import { Loader2Icon } from 'lucide-vue-next';

interface Props {
    buttonText: string;
    loadingText?: string;
    loading?: boolean;
    disabled?: boolean;
    variant?: ButtonVariants['variant'];
    size?: ButtonVariants['size'];
    buttonClass?: HTMLAttributes['class'];
    dropdownClass?: HTMLAttributes['class'];
    dropdownContentClass?: HTMLAttributes['class'];
    dropdownAlign?: 'start' | 'center' | 'end';
    title?: string;
}

withDefaults(defineProps<Props>(), {
    loadingText: 'Loading...',
    loading: false,
    disabled: false,
    variant: 'default',
    size: 'default',
    dropdownAlign: 'end',
});

defineEmits<{
    click: [];
}>();
</script>
