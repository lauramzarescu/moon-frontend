<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

defineProps({
    open: {
        type: Boolean,
        required: true,
    },
});

const emit = defineEmits(['update:open', 'confirm']);

const closeDialog = () => {
    emit('update:open', false);
};
</script>

<template>
    <Dialog :open="open" @update:open="emit('update:open', $event)">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Disable SAML Authentication</DialogTitle>
                <DialogDescription class="pt-4">
                    This will delete your SAML configuration. Users will no longer be able to sign in using SAML. Are you sure you want to
                    continue?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" @click="closeDialog">Cancel</Button>
                <Button variant="destructive" @click="emit('confirm')">Yes, disable</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
