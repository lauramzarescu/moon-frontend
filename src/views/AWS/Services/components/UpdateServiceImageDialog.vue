<template>
    <Button
        v-if="!hideTrigger"
        :variant="isClusterProduction ? 'destructive' : 'secondary'"
        size="sm"
        :class="[
            'h-7 px-2 gap-1',
            isClusterProduction &&
                'border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900',
        ]"
        @click="
            isDialogOpen = true;
            emit('dialog-open');
        "
        :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
    >
        <ShieldAlertIcon v-if="isClusterProduction" class="h-3.5 w-3.5" />
        <Edit2Icon v-else class="h-3.5 w-3.5" />
        <span class="text-xs">{{ isClusterProduction ? 'Update Production' : 'Update Image' }}</span>
    </Button>

    <Dialog v-model:open="isDialogOpen">
        <DialogContent :class="['sm:max-w-[600px]']">
            <DialogHeader>
                <DialogTitle :class="['flex items-center gap-2', isClusterProduction && 'text-red-700 dark:text-red-300']">
                    <AlertTriangleIcon v-if="isClusterProduction && isConfirming" class="h-5 w-5 text-red-600" />
                    <ShieldAlertIcon v-else-if="isClusterProduction" class="h-5 w-5 text-red-600" />
                    {{ getDialogTitle() }}
                </DialogTitle>
                <DialogDescription :class="[isClusterProduction && isConfirming && 'text-red-600 dark:text-red-400']">
                    {{ getDialogDescription() }}
                </DialogDescription>

                <!-- Production Warning Banner -->
                <div
                    v-if="isClusterProduction"
                    class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800"
                >
                    <div class="flex items-center gap-2">
                        <AlertTriangleIcon class="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span class="text-sm font-medium text-red-800 dark:text-red-200">Production Environment</span>
                    </div>
                    <p class="text-xs text-red-700 dark:text-red-300 mt-1">
                        You are updating a service in a production cluster. Please proceed with caution.
                    </p>
                </div>
            </DialogHeader>

            <!-- Form Content -->
            <div v-if="!isConfirming" class="mx-auto w-full">
                <div class="space-y-4">
                    <div class="space-y-2">
                        <Label for="current-image" class="text-sm font-medium">Current Image</Label>
                        <Input id="current-image" :model-value="currentImage" disabled class="bg-muted font-mono text-xs" />
                    </div>
                    <div class="space-y-2">
                        <Label for="new-image" class="flex items-center justify-between text-sm font-medium">
                            New Image URI
                            <span v-if="validationError" class="text-xs text-destructive">{{ validationError }}</span>
                        </Label>
                        <Input
                            id="new-image"
                            :default-value="currentImage"
                            v-model="newImageUri"
                            placeholder="Enter new image URI"
                            :class="['font-mono text-xs', { 'border-destructive': validationError }]"
                        />
                    </div>
                </div>
            </div>

            <!-- Confirmation Content -->
            <div v-else class="mx-auto w-full">
                <div class="space-y-4">
                    <!-- Service Information -->
                    <div class="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div class="space-y-1">
                            <Label class="text-xs text-muted-foreground">Service</Label>
                            <p class="text-sm font-medium">{{ serviceName }}</p>
                        </div>
                        <div class="space-y-1">
                            <Label class="text-xs text-muted-foreground">Cluster</Label>
                            <p class="text-sm font-medium flex items-center gap-1">
                                {{ clusterName }}
                                <ShieldAlertIcon v-if="isClusterProduction" class="h-3 w-3 text-red-600" />
                            </p>
                        </div>
                        <div class="space-y-1 col-span-2">
                            <Label class="text-xs text-muted-foreground">Container</Label>
                            <p class="text-sm font-medium">{{ containerName }}</p>
                        </div>
                    </div>

                    <!-- Image Comparison -->
                    <div class="space-y-3">
                        <Label class="text-sm font-medium">Image Changes</Label>
                        <div class="space-y-2">
                            <div
                                class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800"
                            >
                                <span class="text-red-600 text-xs font-medium">FROM:</span>
                                <code class="text-xs text-red-700 dark:text-red-300 break-all">{{ currentImage }}</code>
                            </div>
                            <div
                                class="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950 dark:border-green-800"
                            >
                                <span class="text-green-600 text-xs font-medium">TO:</span>
                                <code class="text-xs text-green-700 dark:text-green-300 break-all">{{ newImageUri }}</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="handleClose">
                    {{ isConfirming ? 'Back' : 'Cancel' }}
                </Button>
                <Button
                    type="submit"
                    @click="isConfirming ? handleSubmit() : showConfirmation()"
                    :disabled="isLoading || (!isConfirming && (!newImageUri || !!validationError))"
                    :variant="isConfirming && isClusterProduction ? 'destructive' : 'default'"
                    :class="[isConfirming && isClusterProduction && 'bg-red-600 hover:bg-red-700 border-red-600']"
                >
                    <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    <AlertTriangleIcon v-else-if="isConfirming && isClusterProduction" class="w-4 h-4 mr-2" />
                    {{ buttonText }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangleIcon, Edit2Icon, Loader2Icon, ShieldAlertIcon } from 'lucide-vue-next';
import { AwsService } from '@/services/aws.service.ts';
import { serviceUpdateImageSchema } from '../components/schema.ts';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';

const { hasPermission } = usePermissions();
const props = defineProps<{
    currentImage: string;
    containerName: string;
    clusterName: string;
    serviceName: string;
    isClusterProduction: boolean;
    hideTrigger?: boolean;
    open?: boolean;
    confirmOnly?: boolean;
    defaultNewImageUri?: string;
}>();

const emit = defineEmits<{
    (e: 'image-updated'): void;
    (e: 'dialog-close'): void;
    (e: 'dialog-open'): void;
    (e: 'update:open', value: boolean): void;
}>();

const isDialogOpen = ref(false);
const isConfirming = ref(false);
const newImageUri = ref('');
const isLoading = ref(false);
const validationError = ref('');
const awsService = new AwsService();

// External open control
watch(
    () => props.open,
    (val) => {
        if (typeof val === 'boolean') {
            isDialogOpen.value = val;
        }
    },
    { immediate: true },
);

watch(isDialogOpen, (val) => emit('update:open', val));

// Validate input when newImageUri changes
watch(newImageUri, (value) => {
    try {
        serviceUpdateImageSchema.parse({
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.containerName,
            newImageUri: value,
            oldImageUri: props.currentImage,
        });
        validationError.value = '';
    } catch (error: unknown) {
        const err = error as { errors?: Array<{ message: string }> };
        if (err?.errors && err.errors.length > 0) {
            validationError.value = err.errors[0].message;
        } else {
            validationError.value = 'Invalid input';
        }
    }
});

const buttonText = computed(() => {
    if (isLoading.value) return 'Updating...';
    if (isConfirming.value) {
        return props.isClusterProduction ? 'Confirm Production Update' : 'Confirm Update';
    }
    return 'Update Image';
});

const getDialogTitle = () => {
    if (isConfirming.value) {
        return props.isClusterProduction ? 'Confirm Production Image Update' : 'Confirm Image Update';
    }
    return props.isClusterProduction ? 'Update Production Container Image' : 'Update Container Image';
};

const getDialogDescription = () => {
    if (isConfirming.value) {
        const baseMessage = `Are you sure you want to update the image?`;
        if (props.isClusterProduction) {
            return `${baseMessage} This will affect a production service.`;
        }
        return baseMessage;
    }
    return 'Specify the new image URI for this container.';
};

const showConfirmation = () => {
    isConfirming.value = true;
};

const cancelConfirmation = () => {
    isConfirming.value = false;
};

const handleClose = () => {
    if (isConfirming.value) {
        cancelConfirmation();
    } else {
        isDialogOpen.value = false;
        newImageUri.value = props.currentImage;
        emit('dialog-close');
    }
};

const handleSubmit = async () => {
    try {
        isLoading.value = true;

        await awsService.updateServiceImage({
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.containerName,
            newImageUri: newImageUri.value,
            oldImageUri: props.currentImage,
        });

        emit('image-updated');
        isDialogOpen.value = false;
        isConfirming.value = false;
        emit('dialog-close');
    } catch (error) {
        console.error('Failed to update image:', error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    newImageUri.value = props.defaultNewImageUri ?? props.currentImage;
});

watch(isDialogOpen, (open) => {
    if (open && props.confirmOnly) {
        isConfirming.value = true;
    }
});
</script>
