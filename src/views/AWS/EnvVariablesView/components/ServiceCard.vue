<template>
    <Card
        class="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/20 service-card"
        @click="$emit('click')"
    >
        <div class="p-4">
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                    <div
                        class="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300"
                    >
                        <ServerIcon class="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 class="font-semibold text-base group-hover:text-primary transition-colors duration-200">
                            {{ service.name }}
                        </h3>
                        <div class="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" class="text-xs px-2 py-0.5">
                                {{ service.clusterName }}
                            </Badge>
                            <Badge :variant="service.status === 'ACTIVE' ? 'default' : 'secondary'" class="text-xs px-2 py-0.5">
                                {{ service.status }}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ChevronRightIcon class="h-5 w-5 text-muted-foreground" />
                </div>
            </div>

            <!-- Environment Variables Summary -->
            <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground flex items-center gap-1">
                        <GlobeIcon class="h-3 w-3" />
                        Environment Variables
                    </span>
                    <span class="font-medium">{{ environmentVariablesCount }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground flex items-center gap-1">
                        <KeyIcon class="h-3 w-3" />
                        Secrets
                    </span>
                    <span class="font-medium">{{ secretsCount }}</span>
                </div>
                <div class="flex items-center justify-between text-sm border-t pt-2">
                    <span class="text-muted-foreground flex items-center gap-1">
                        <ContainerIcon class="h-3 w-3" />
                        Containers
                    </span>
                    <span class="font-medium">{{ service.containers.length }}</span>
                </div>
            </div>

            <!-- Version Info -->
            <div class="mt-3 pt-3 border-t">
                <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground">Current Version</span>
                    <Badge variant="outline" class="text-xs">
                        {{ currentVersion }}
                    </Badge>
                </div>
                <div class="flex items-center justify-between text-xs mt-1">
                    <span class="text-muted-foreground">Task Definition</span>
                    <span class="text-xs font-mono">{{ service.taskDefinition.arn.split('/').pop() }}</span>
                </div>
            </div>

            <!-- Hover Effect Overlay -->
            <div
                class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"
            />
        </div>
    </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRightIcon, ContainerIcon, GlobeIcon, KeyIcon, ServerIcon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

const props = defineProps<{
    service: ServiceInterface;
}>();

const emit = defineEmits<{
    (e: 'click'): void;
}>();

// Computed properties for environment variables and secrets count
const environmentVariablesCount = computed(() => {
    return props.service.containers.reduce((total, container) => {
        return total + (container.environmentVariables.environment?.length || 0);
    }, 0);
});

const secretsCount = computed(() => {
    return props.service.containers.reduce((total, container) => {
        return total + (container.environmentVariables.secrets?.length || 0);
    }, 0);
});

// Current revision from task definition
const currentVersion = computed(() => {
    return `Revision ${props.service.taskDefinition.revision}`;
});
</script>

<style scoped>
.service-card {
    position: relative;
    overflow: hidden;
}

.service-card:hover {
    transform: translateY(-2px) scale(1.02);
}

.service-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.6), transparent);
    transition: left 0.5s ease;
}

.service-card:hover::before {
    left: 100%;
}
</style>
