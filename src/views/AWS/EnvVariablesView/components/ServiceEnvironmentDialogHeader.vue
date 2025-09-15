<template>
    <DialogHeader>
        <DialogTitle class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ServerIcon class="h-4 w-4" />
            </div>
            <div class="flex items-center flex-wrap gap-2">
                <span class="text-lg font-semibold mr-1">{{ service?.name }}</span>
                <Badge variant="secondary" class="text-xs">{{ service?.clusterName }}</Badge>
                <Badge :variant="service?.status === 'ACTIVE' ? 'default' : 'secondary'" class="text-xs">
                    {{ service?.status }}
                </Badge>
                <Badge v-if="hasStoredUnsavedChanges" variant="destructive" class="text-xs">
                    {{ unsavedChangesCount }} Unsaved Changes
                </Badge>
            </div>
        </DialogTitle>
        <DialogDescription class="mt-2">
            Manage environment variables and secrets for this service
        </DialogDescription>
    </DialogHeader>
</template>

<script setup lang="ts">
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ServerIcon } from 'lucide-vue-next';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

interface Props {
    service: ServiceInterface | null;
    hasStoredUnsavedChanges: boolean;
    unsavedChangesCount: number;
}

defineProps<Props>();
</script>
