<template>
    <div class="flex items-center justify-between pt-4 border-t bg-background">
        <div class="flex items-center gap-2">
            <Button variant="outline" @click="$emit('cancel')" :disabled="isDeploying"> Cancel </Button>
            <Button v-if="currentStep > 1" variant="outline" @click="$emit('previous')" :disabled="isDeploying">
                <ChevronLeftIcon class="w-4 h-4 mr-1" />
                Previous
            </Button>
        </div>

        <div class="flex items-center gap-3">
            <!-- Step indicator -->
            <div class="text-sm text-muted-foreground">Step {{ currentStep }} of {{ totalSteps }}</div>

            <!-- Selected services count -->
            <Badge v-if="selectedCount > 0" variant="outline"> {{ selectedCount }} selected </Badge>

            <!-- Next/Deploy button -->
            <Button v-if="currentStep < totalSteps" @click="$emit('next')" :disabled="!canProceed || isDeploying">
                Next
                <ChevronRightIcon class="w-4 h-4 ml-1" />
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next';

const props = defineProps<{
    currentStep: number;
    totalSteps: number;
    canProceed: boolean;
    selectedCount: number;
    isDeploying: boolean;
}>();

const emit = defineEmits<{
    (e: 'next'): void;
    (e: 'previous'): void;
    (e: 'cancel'): void;
}>();
</script>
