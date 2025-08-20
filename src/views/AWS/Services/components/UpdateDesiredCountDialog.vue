<template>
    <Dialog v-model:open="isDialogOpen">
        <DialogTrigger asChild>
            <Button
                :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
                @click="emit('dialog-open')"
                variant="outline"
                size="default"
                class="px-4 py-2 gap-2 transition-all duration-200 hover:shadow-sm group"
            >
                <Edit2Icon class="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
                <span class="text-sm">Update Count</span>
            </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{{ isConfirming ? 'Confirm Update' : 'Update Desired Count' }}</DialogTitle>
                <DialogDescription>
                    {{
                        isConfirming
                            ? `Are you sure you want to update the desired count from ${currentCount} to ${desiredCount} tasks?`
                            : 'Set the number of tasks you want running for this service.'
                    }}
                </DialogDescription>
            </DialogHeader>

            <div v-if="!isConfirming" class="mx-auto w-full max-w-sm">
                <div class="p-4 pb-0">
                    <div class="flex items-center justify-center space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            class="h-8 w-8 shrink-0 rounded-full transition-all duration-200 hover:shadow-md"
                            @click="decrementCount"
                            :disabled="desiredCount <= 0"
                        >
                            <MinusIcon class="h-4 w-4 transition-transform duration-200" />
                            <span class="sr-only">Decrease</span>
                        </Button>
                        <div class="flex-1 text-center">
                            <div class="text-5xl font-bold tracking-tighter transition-all duration-300">
                                {{ desiredCount }}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            class="h-8 w-8 shrink-0 rounded-full transition-all duration-200 hover:shadow-md"
                            @click="incrementCount"
                        >
                            <PlusIcon class="h-4 w-4 transition-transform duration-200" />
                            <span class="sr-only">Increase</span>
                        </Button>
                    </div>
                    <p class="mt-4 text-xs text-foreground">Current running tasks: {{ currentCount }}</p>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="handleClose">
                    {{ isConfirming ? 'Back' : 'Cancel' }}
                </Button>
                <Button
                    type="submit"
                    @click="isConfirming ? handleSubmit() : showConfirmation()"
                    :disabled="isLoading || (!isConfirming && desiredCount === currentCount)"
                >
                    <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    {{ buttonText }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit2Icon, Loader2Icon, MinusIcon, PlusIcon } from 'lucide-vue-next';
import { AwsService } from '@/services/aws.service.ts';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';

const { hasPermission } = usePermissions();
const props = defineProps<{
    currentCount: number;
    serviceArn: string;
    clusterName: string;
    serviceName: string;
}>();

const emit = defineEmits<{
    (e: 'count-updated'): void;
    (e: 'dialog-close'): void;
    (e: 'dialog-open'): void;
}>();

const isDialogOpen = ref(false);
const isConfirming = ref(false);
const desiredCount = ref(props.currentCount);
const isLoading = ref(false);
const awsService = new AwsService();

const buttonText = computed(() => {
    if (isLoading.value) return 'Updating...';
    if (isConfirming.value) return 'Confirm Update';
    return 'Update Count';
});

const incrementCount = () => {
    desiredCount.value++;
};

const decrementCount = () => {
    if (desiredCount.value > 0) {
        desiredCount.value--;
    }
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
        emit('dialog-close');
    }
};

const handleSubmit = async () => {
    try {
        isLoading.value = true;

        await awsService.updateServiceDesiredCount({
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            desiredCount: desiredCount.value,
        });

        emit('count-updated');
        isDialogOpen.value = false;
        isConfirming.value = false;
        emit('dialog-close');
    } catch (error) {
        console.error('Failed to update desired count:', error);
    } finally {
        isLoading.value = false;
    }
};
</script>
