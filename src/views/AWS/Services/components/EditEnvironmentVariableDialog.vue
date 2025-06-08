<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>Edit {{ type === 'environment' ? 'Environment Variable' : 'Secret' }}</DialogTitle>
                <DialogDescription> Update the value for {{ variableName }} </DialogDescription>
            </DialogHeader>

            <form @submit.prevent="handleSubmit" class="space-y-4">
                <div class="space-y-2">
                    <Label for="name">Name</Label>
                    <Input id="name" :value="variableName" disabled class="bg-muted" />
                </div>

                <div class="space-y-2">
                    <Label for="value">Value</Label>
                    <Textarea
                        id="value"
                        v-model="form.value"
                        placeholder="Enter new value..."
                        required
                        :class="{ 'border-red-500': errors.value }"
                        rows="3"
                    />
                    <p v-if="errors.value" class="text-sm text-red-500">{{ errors.value }}</p>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" @click="isOpen = false"> Cancel </Button>
                    <Button type="submit" :disabled="isLoading">
                        <Loader2Icon v-if="isLoading" class="h-4 w-4 animate-spin mr-2" />
                        Update Variable
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { Loader2Icon } from 'lucide-vue-next';
import { reactive, ref, watch } from 'vue';
import { AwsService } from '@/services/aws.service';

const props = defineProps<{
    open: boolean;
    clusterName: string;
    serviceName: string;
    containerName: string;
    variableName: string;
    currentValue: string;
    type: 'environment' | 'secret';
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'variable-updated'): void;
}>();

const { toast } = useToast();
const awsService = new AwsService();

const isOpen = ref(props.open);
const isLoading = ref(false);

const form = reactive({
    value: props.currentValue,
});

const errors = reactive({
    value: '',
});

watch(
    () => props.open,
    (newValue) => {
        isOpen.value = newValue;
        if (newValue) {
            form.value = props.currentValue;
        }
    },
);

watch(isOpen, (newValue) => {
    emit('update:open', newValue);
});

const validateForm = () => {
    errors.value = '';

    if (!form.value.trim()) {
        errors.value = 'Value is required';
        return false;
    }

    return true;
};

const handleSubmit = async () => {
    if (!validateForm()) return;

    isLoading.value = true;

    try {
        // First remove the old variable, then add the new one
        await awsService.removeEnvironmentVariable({
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.containerName,
            type: props.type,
            name: props.variableName,
        });

        await awsService.addEnvironmentVariable({
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.containerName,
            type: props.type,
            name: props.variableName,
            value: form.value,
        });

        toast({
            variant: 'success',
            title: 'Variable updated successfully',
            description: `${props.type === 'environment' ? 'Environment variable' : 'Secret'} "${props.variableName}" has been updated.`,
        });

        isOpen.value = false;
        emit('variable-updated');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to update variable',
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    } finally {
        isLoading.value = false;
    }
};
</script>
