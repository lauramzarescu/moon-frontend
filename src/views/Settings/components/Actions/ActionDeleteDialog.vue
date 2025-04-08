<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const props = defineProps<{
    open: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'confirm'): void;
}>();

const closeDialog = () => {
    emit('update:open', false);
};
</script>

<template>
    <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete Action</DialogTitle>
                <DialogDescription> Are you sure you want to delete this action? This action cannot be undone. </DialogDescription>
            </DialogHeader>
            <DialogFooter class="flex items-center justify-end gap-2 pt-4">
                <Button variant="outline" @click="closeDialog"> Cancel</Button>
                <Button variant="destructive" @click="emit('confirm')"> Delete</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
