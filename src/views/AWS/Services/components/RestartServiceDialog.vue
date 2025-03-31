<template>
    <Dialog :open="isOpen" @update:open="updateOpen">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Restart Service</DialogTitle>
                <DialogDescription> Are you sure you want to restart the service "{{ serviceName }}"? </DialogDescription>
            </DialogHeader>
            <div class="flex justify-end space-x-2 pt-4">
                <Button variant="outline" @click="cancel">Cancel</Button>
                <Button variant="destructive" @click="confirm" :disabled="isLoading">
                    <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    Restart
                </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-vue-next';
import { ref } from 'vue';

const props = defineProps<{
    isOpen: boolean;
    serviceName: string;
    clusterName: string;
}>();

const emit = defineEmits(['dialog-close', 'dialog-open', 'confirm']);

const isLoading = ref(false);

const updateOpen = (value: boolean) => {
    if (value) {
        emit('dialog-open');
    } else {
        emit('dialog-close');
    }
};

const confirm = async () => {
    isLoading.value = true;
    try {
        emit('confirm', {
            serviceName: props.serviceName,
            clusterName: props.clusterName,
        });
    } finally {
        isLoading.value = false;
        updateOpen(false);
    }
};

const cancel = () => {
    updateOpen(false);
};
</script>
