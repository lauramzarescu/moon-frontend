<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>Restore to Version</DialogTitle>
                <DialogDescription>
                    Are you sure you want to restore to <strong>version {{ selectedVersion }}</strong>?
                    <br><br>
                    This will replace the current environment variables with those from the selected version. This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="gap-2">
                <Button variant="outline" @click="closeDialog">
                    Cancel
                </Button>
                <Button variant="destructive" @click="confirmRestore">
                    Restore to Version
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
    open: boolean;
    selectedVersion: string;
}

interface Emits {
    (e: 'update:open', value: boolean): void;
    (e: 'confirm'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
});

const closeDialog = () => {
    emit('update:open', false);
};

const confirmRestore = () => {
    emit('confirm');
};
</script>
