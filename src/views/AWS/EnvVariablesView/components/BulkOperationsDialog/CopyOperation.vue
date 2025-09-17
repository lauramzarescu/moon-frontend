<template>
    <div class="space-y-4">
        <div>
            <h3 class="text-lg font-medium mb-2">Copy Variables</h3>
            <p class="text-sm text-muted-foreground mb-4">Copy selected variables to another service or version</p>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
                <div>
                    <Label class="text-sm font-medium mb-2 block">Destination Service</Label>
                    <SearchableServiceSelect
                        v-model="copyDestinationProxy.service"
                        :available-services="availableServices"
                        placeholder="Select service"
                        search-placeholder="Search services..."
                    />
                </div>

                <div>
                    <Label class="text-sm font-medium mb-2 block">Destination Container</Label>
                    <Select v-model="copyDestinationProxy.container" :disabled="!copyDestinationProxy.service">
                        <SelectTrigger>
                            <SelectValue placeholder="Select container" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="container in destinationContainers" :key="container" :value="container">
                                {{ container }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label class="text-sm font-medium mb-2 block">Operation Type</Label>
                    <RadioGroup v-model="operationProxy" class="flex flex-col space-y-2">
                        <div class="flex items-center space-x-2">
                            <RadioGroupItem :value="BulkOperationType.COPY" id="copy" />
                            <Label for="copy" class="text-sm">Copy (keep original variables)</Label>
                        </div>
                        <div class="flex items-center space-x-2">
                            <RadioGroupItem :value="BulkOperationType.MOVE" id="move" />
                            <Label for="move" class="text-sm">Move (remove from source)</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div class="flex items-center space-x-2">
                    <Checkbox id="copySelectedOnly" v-model:checked="copySelectedOnlyProxy" />
                    <Label for="copySelectedOnly" class="text-sm">Copy only selected variables</Label>
                </div>
            </div>

            <div class="space-y-4">
                <div>
                    <Label class="text-sm font-medium mb-2 block">Variables to Copy</Label>
                    <div class="border rounded-lg p-3 bg-muted/50 max-h-64 overflow-y-auto">
                        <div v-if="variablesByContainer.size === 0" class="text-sm text-muted-foreground text-center py-4">
                            No variables selected
                        </div>
                        <div v-else class="space-y-3">
                            <div v-for="[containerName, variables] in variablesByContainer" :key="containerName" class="space-y-2">
                                <div class="text-sm font-medium text-muted-foreground">{{ containerName }}</div>
                                <div class="space-y-1">
                                    <div
                                        v-for="variable in variables"
                                        :key="variable.name"
                                        class="flex items-center justify-between text-sm p-2 bg-background rounded"
                                    >
                                        <div class="flex items-center gap-2">
                                            <Badge :variant="variable.isSecret ? 'secondary' : 'default'" class="text-xs">
                                                {{ variable.isSecret ? 'SECRET' : 'ENV' }}
                                            </Badge>
                                            <span class="font-mono">{{ variable.name }}</span>
                                        </div>
                                        <span class="text-muted-foreground truncate max-w-32">
                                            {{ variable.value }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-if="copyDestination.service && copyDestination.container"
                    class="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                    <div class="flex items-start gap-2">
                        <InfoIcon class="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div class="text-sm">
                            <div class="font-medium text-blue-900 dark:text-blue-100">
                                {{ copyDestination.operation === BulkOperationType.MOVE ? 'Move' : 'Copy' }} Preview
                            </div>
                            <div class="text-blue-700 dark:text-blue-300 mt-1">
                                {{ totalSelectedCount }} variable(s) will be
                                {{ copyDestination.operation === BulkOperationType.MOVE ? 'moved' : 'copied' }} to
                                <span class="font-mono">{{ copyDestination.service }}/{{ copyDestination.container }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from 'lucide-vue-next';
import { BulkOperationType } from '@/types/aws';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import SearchableServiceSelect from './SearchableServiceSelect.vue';

interface Props {
    availableServices: ServiceInterface[];
    copyDestination: {
        service: string;
        container: string;
        operation: string;
    };
    copySelectedOnly: boolean;
    destinationContainers: string[];
    variablesByContainer: Map<
        string,
        Array<{
            name: string;
            value: string;
            isSecret: boolean;
            container: string;
        }>
    >;
    totalSelectedCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:copy-destination', value: Props['copyDestination']): void;
    (e: 'update:copy-selected-only', value: boolean): void;
}>();

const { copyDestination, copySelectedOnly } = toRefs(props);

// Create reactive references that emit updates
const copyDestinationProxy = computed({
    get: () => props.copyDestination,
    set: (value) => emit('update:copy-destination', value),
});

const copySelectedOnlyProxy = computed({
    get: () => props.copySelectedOnly,
    set: (value) => emit('update:copy-selected-only', value),
});

const operationProxy = computed({
    get: () => props.copyDestination.operation,
    set: (value) => emit('update:copy-destination', { ...props.copyDestination, operation: value }),
});
</script>
