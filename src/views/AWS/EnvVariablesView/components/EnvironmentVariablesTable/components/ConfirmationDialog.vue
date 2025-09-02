<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                    <div v-if="isBulk">
                        Are you sure you want to delete <strong>{{ variablesToDelete.length }}</strong> selected variables?
                        <br><br>
                        <div class="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                            <div v-for="variable in variablesToDelete" :key="variable.name" class="flex items-center gap-2 py-1">
                                <Badge :variant="variable.isSecret ? 'secondary' : 'default'" class="text-xs">
                                    {{ variable.isSecret ? 'SECRET' : 'ENV' }}
                                </Badge>
                                <span class="font-mono text-xs">{{ variable.name }}</span>
                            </div>
                        </div>
                        <br>
                        This action cannot be undone.
                    </div>
                    <div v-else>
                        Are you sure you want to delete the {{ isSecret ? 'secret' : 'environment variable' }} 
                        <strong>"{{ variable?.name }}"</strong>?
                        <br><br>
                        This action cannot be undone.
                    </div>
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="gap-2">
                <Button variant="outline" @click="closeDialog">
                    Cancel
                </Button>
                <Button variant="destructive" @click="confirmDelete">
                    <span v-if="isBulk">Delete {{ variablesToDelete.length }} Variables</span>
                    <span v-else>Delete</span>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VariableType } from '@/types/aws/environment-variable.enums';
import type { ConfirmationDialogState } from '../types';

interface Props {
    modelValue: ConfirmationDialogState;
}

interface Emits {
    (e: 'update:modelValue', value: ConfirmationDialogState): void;
    (e: 'confirm'): void;
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Computed properties
const isOpen = computed({
    get: () => props.modelValue.isOpen,
    set: (value) => emit('update:modelValue', { ...props.modelValue, isOpen: value }),
});

const variable = computed(() => props.modelValue.variable);
const variablesToDelete = computed(() => props.modelValue.variablesToDelete);
const isBulk = computed(() => props.modelValue.isBulk);
const isSecret = computed(() => props.modelValue.type === VariableType.SECRET);

// Methods
const confirmDelete = () => {
    emit('confirm');
};

const closeDialog = () => {
    emit('close');
};
</script>
