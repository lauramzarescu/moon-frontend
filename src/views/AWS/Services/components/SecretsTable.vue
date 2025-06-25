<template>
    <Card class="" :inert="editDialog.isOpen || addDialog.isOpen">
        <div class="flex">
            <div class="w-2 h-full bg-primary"></div>
            <div class="flex-1">
                <CardHeader class="py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="p-2 rounded-lg bg-primary/10">
                                <SettingsIcon class="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle class="text-base">Environment Variables</CardTitle>
                                <CardDescription class="text-xs">Configuration and Secrets</CardDescription>
                            </div>
                        </div>
                        <!-- Action Buttons -->
                        <div class="flex items-center gap-2">
                            <SecretsComparisonDialog v-if="allServices" :services="allServices" />
                            <AddEnvironmentVariableDialog
                                v-model:open="addDialog.isOpen"
                                :cluster-name="clusterName"
                                :service-name="serviceName"
                                :container-name="container.name"
                                @variable-added="handleRefresh"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow class="hover:bg-transparent">
                                <TableHead class="w-1/3 text-primary">Name</TableHead>
                                <TableHead class="w-2/3 text-primary">Value</TableHead>
                                <TableHead class="w-20 text-primary">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-for="env in sortedEnvironmentVariables" :key="env.name" class="hover:bg-muted/10">
                                <TableCell class="font-medium group">
                                    <div class="flex items-center gap-2">
                                        <div class="p-1.5 bg-green-100 dark:bg-green-900 rounded-md">
                                            <GlobeIcon class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                        </div>
                                        {{ env.name }}
                                        <button
                                            @click="copyToClipboard(env.name)"
                                            class="invisible group-hover:visible hover:text-primary transition-colors"
                                        >
                                            <CopyIcon class="h-4 w-4" />
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell class="group">
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono bg-muted px-2 py-1 rounded text-sm">{{ env.value }}</span>
                                        <button
                                            @click="copyToClipboard(env.value)"
                                            class="invisible group-hover:visible hover:text-primary transition-colors"
                                        >
                                            <CopyIcon class="h-4 w-4" />
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger as-child>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontalIcon class="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem @click="openEditDialog(env)">
                                                <EditIcon class="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="deleteVariable(env.name)" class="text-red-600">
                                                <TrashIcon class="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                            <TableRow v-for="secret in sortedSecrets" :key="secret.name" class="hover:bg-muted/10">
                                <TableCell class="font-medium group">
                                    <div class="flex items-center gap-2">
                                        <div class="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-md">
                                            <KeyIcon class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        {{ secret.name }}
                                        <button
                                            @click="copyToClipboard(secret.name)"
                                            class="invisible group-hover:visible hover:text-primary transition-colors"
                                        >
                                            <CopyIcon class="h-4 w-4" />
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell class="group">
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono bg-muted px-2 py-1 rounded text-sm">{{ secret.value }}</span>
                                        <button
                                            @click="copyToClipboard(secret.value)"
                                            class="invisible group-hover:visible hover:text-primary transition-colors"
                                        >
                                            <CopyIcon class="h-4 w-4" />
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger as-child>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontalIcon class="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem @click="deleteVariable(secret.name)" class="text-red-600">
                                                <TrashIcon class="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </div>
        </div>
    </Card>

    <!-- Edit Environment Variable Dialog -->
    <EditEnvironmentVariableDialog
        v-model:open="editDialog.isOpen"
        :cluster-name="clusterName"
        :service-name="serviceName"
        :container-name="container.name"
        :variable-name="editDialog.variableName"
        :current-value="editDialog.currentValue"
        @variable-updated="handleRefresh"
    />
</template>

<script setup lang="ts">
import type { ContainerInterface, ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { CopyIcon, EditIcon, GlobeIcon, KeyIcon, MoreHorizontalIcon, SettingsIcon, TrashIcon } from 'lucide-vue-next';
import { computed, reactive } from 'vue';
import { AwsService } from '@/services/aws.service';
import SecretsComparisonDialog from './EnvironmentVariablesComparison/SecretsComparisonDialog.vue';
import AddEnvironmentVariableDialog from './AddEnvironmentVariableDialog.vue';
import EditEnvironmentVariableDialog from './EditEnvironmentVariableDialog.vue';
import type { RemoveEnvironmentVariablesInput } from '@/views/AWS/Services/components/environment-variable.schema';

const { toast } = useToast();
const awsService = new AwsService();

const props = defineProps<{
    container: ContainerInterface;
    clusterName: string;
    serviceName: string;
    allServices?: ServiceInterface[];
}>();

const emit = defineEmits<{
    (e: 'refresh'): void;
}>();

// Edit dialog state
const editDialog = reactive({
    isOpen: false,
    variableName: '',
    currentValue: '',
    type: 'environment' as 'environment' | 'secret',
});

// Add dialog state
const addDialog = reactive({
    isOpen: false,
});

const sortedEnvironmentVariables = computed(() => {
    return [...props.container.environmentVariables.environment].sort((a, b) => a.name.localeCompare(b.name));
});

const sortedSecrets = computed(() => {
    return [...props.container.environmentVariables.secrets].sort((a, b) => a.name.localeCompare(b.name));
});

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast({
            variant: 'success',
            title: 'Copied to clipboard',
            duration: 2000,
        });
    } catch (err) {
        toast({
            variant: 'destructive',
            title: 'Failed to copy',
            duration: 2000,
        });
    }
};

const openEditDialog = (variable: { name: string; value: string }) => {
    editDialog.variableName = variable.name;
    editDialog.currentValue = variable.value;
    editDialog.isOpen = true;
};

const deleteVariable = async (variableName: string) => {
    try {
        const payload: RemoveEnvironmentVariablesInput = {
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.container.name,
            variableNames: [variableName],
        };

        await awsService.removeEnvironmentVariables(payload);

        toast({
            variant: 'success',
            title: 'Variable deleted successfully',
            description: `Environment variable "${variableName}" has been deleted.`,
        });

        handleRefresh();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to delete variable',
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
};

const handleRefresh = () => {
    emit('refresh');
};
</script>
