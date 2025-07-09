<template>
    <div class="border rounded-lg p-6 bg-card">
        <div class="flex items-center justify-between mb-4">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-semibold text-base truncate">{{ service.serviceName }}</h4>
                    <Badge :variant="getStatusVariant(service.status)" class="text-xs">
                        {{ service.status }}
                    </Badge>
                </div>
                <p class="text-sm text-muted-foreground truncate">
                    <ServerIcon class="inline h-3 w-3 mr-1" />
                    {{ service.clusterName }}
                </p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                @click="$emit('service-removed')"
                class="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
                <Trash2Icon class="h-4 w-4" />
            </Button>
        </div>

        <div class="space-y-4">
            <!-- Current Image -->
            <div class="space-y-2">
                <Label class="text-sm font-medium flex items-center gap-2">
                    <ContainerIcon class="h-4 w-4" />
                    Current Image
                </Label>
                <div class="relative">
                    <Input :default-value="service.image" :value="service.image" disabled class="bg-muted text-sm font-mono pr-10" />
                    <Button
                        variant="ghost"
                        size="sm"
                        @click="copyToClipboard(service.image)"
                        class="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                        <CopyIcon class="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <!-- New Image URI -->
            <div class="space-y-2">
                <Label class="text-sm font-medium flex items-center justify-between">
                    <span class="flex items-center gap-2">
                        <ImageIcon class="h-4 w-4" />
                        New Image URI
                    </span>
                    <span v-if="deploymentData?.validationError" class="text-xs text-destructive">
                        {{ deploymentData.validationError }}
                    </span>
                </Label>
                <div class="relative">
                    <Input
                        :default-value="deploymentData?.newImageUri || ''"
                        :model-value="deploymentData?.newImageUri"
                        @input="handleImageUpdate($event.target.value)"
                        placeholder="Enter new container image URI..."
                        class="font-mono pr-20"
                        :class="{ 'border-destructive focus:border-destructive': deploymentData?.validationError }"
                    />
                    <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <Button
                            v-if="deploymentData?.newImageUri"
                            variant="ghost"
                            size="sm"
                            @click="copyToClipboard(deploymentData.newImageUri)"
                            class="h-6 w-6 p-0"
                        >
                            <CopyIcon class="h-3 w-3" />
                        </Button>
                        <Button v-if="deploymentData?.newImageUri" variant="ghost" size="sm" @click="resetToOriginal" class="h-6 w-6 p-0">
                            <RotateCcwIcon class="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Image Comparison -->
            <div v-if="deploymentData?.newImageUri && deploymentData.newImageUri !== service.image" class="space-y-2">
                <Label class="text-sm font-medium text-muted-foreground">Changes</Label>
                <div class="p-3 bg-muted/50 rounded-md border">
                    <div class="flex items-center gap-2 text-xs">
                        <div class="flex items-center gap-1 text-red-600">
                            <MinusIcon class="h-3 w-3" />
                            <span class="font-mono">{{ service.image }}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-xs mt-1">
                        <div class="flex items-center gap-1 text-green-600">
                            <PlusIcon class="h-3 w-3" />
                            <span class="font-mono">{{ deploymentData.newImageUri }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Validation Status -->
            <div class="flex items-center gap-2 text-sm">
                <div v-if="deploymentData?.validationError" class="flex items-center gap-2 text-destructive">
                    <AlertCircleIcon class="h-4 w-4" />
                    <span>Configuration invalid</span>
                </div>
                <div v-else-if="deploymentData?.newImageUri" class="flex items-center gap-2 text-green-600">
                    <CheckCircleIcon class="h-4 w-4" />
                    <span>Ready for deployment</span>
                </div>
                <div v-else class="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangleIcon class="h-4 w-4" />
                    <span>Awaiting configuration</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast/use-toast';
import {
    AlertCircleIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    ContainerIcon,
    CopyIcon,
    ImageIcon,
    MinusIcon,
    PlusIcon,
    RotateCcwIcon,
    ServerIcon,
    Trash2Icon,
} from 'lucide-vue-next';
import type { ServiceDeploymentData, TransformedService } from '../types';
import { useServiceTransform } from '../composables/useServiceTransform';

const props = defineProps<{
    service: TransformedService;
    deploymentData?: ServiceDeploymentData;
}>();

const emit = defineEmits<{
    (e: 'image-updated', imageUri: string): void;
    (e: 'service-removed'): void;
}>();

const { toast } = useToast();
const { getStatusVariant } = useServiceTransform();

const handleImageUpdate = (value: string) => {
    emit('image-updated', value);
};

const resetToOriginal = () => {
    emit('image-updated', props.service.image);
};

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast({
            title: 'Copied to clipboard',
            description: 'Image URI has been copied to your clipboard',
        });
    } catch (error) {
        toast({
            title: 'Failed to copy',
            description: 'Could not copy to clipboard',
            variant: 'destructive',
        });
    }
};
</script>
