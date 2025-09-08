<template>
    <div class="border-b">
        <div class="flex items-center px-3 py-1">
            <button
                v-for="container in containers"
                :key="container.name"
                @click="$emit('update:selectedContainer', container.name)"
                :class="[
                    'inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-all duration-200 -mb-px',
                    selectedContainer === container.name
                        ? 'bg-background text-foreground border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border-transparent',
                ]"
            >
                {{ container.name }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Container {
    name: string;
    environmentVariables: {
        environment?: Array<{ name: string; value: string }>;
        secrets?: Array<{ name: string; valueFrom: string }>;
    };
}

interface Props {
    containers: Container[];
    selectedContainer: string;
}

interface Emits {
    (e: 'update:selectedContainer', value: string): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>
