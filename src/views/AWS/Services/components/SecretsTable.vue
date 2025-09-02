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
                        <div class="flex items-center gap-2">
                            <Button variant="outline" size="sm" @click="goToCentral"> Central Manager </Button>
                            <SecretsComparisonDialog
                                :services="services"
                                :filteredServices="[service]"
                                :is-filtered="true"
                                :show-all-services="true"
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
                                            @click.stop="onCopy(env.name)"
                                            class="inline-flex items-center gap-1 whitespace-nowrap invisible group-hover:visible text-muted-foreground hover:text-foreground transition-all duration-200"
                                            :aria-label="copiedName === env.name ? 'Copied' : 'Copy name'"
                                            :title="copiedName === env.name ? 'Copied' : 'Copy name'"
                                        >
                                            <component :is="copiedName === env.name ? Check : Copy" class="h-4 w-4" />
                                            <span v-if="copiedName === env.name" class="text-xs ml-1 max-w-48 truncate align-middle"
                                                >Copied</span
                                            >
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell class="group">
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono bg-muted px-2 py-1 rounded text-sm">{{ env.value }}</span>
                                        <button
                                            @click.stop="onCopy(env.value)"
                                            class="inline-flex items-center gap-1 whitespace-nowrap invisible group-hover:visible text-muted-foreground hover:text-foreground transition-all duration-200"
                                            :aria-label="copiedValue === env.value ? 'Copied' : 'Copy value'"
                                            :title="copiedValue === env.value ? 'Copied' : 'Copy value'"
                                        >
                                            <component :is="copiedValue === env.value ? Check : Copy" class="h-4 w-4" />
                                            <span v-if="copiedValue === env.value" class="text-xs ml-1 max-w-48 truncate align-middle"
                                                >Copied</span
                                            >
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
                                            <DropdownMenuItem disabled @click="openEditDialog(env)">
                                                <EditIcon class="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem disabled @click="deleteVariable(env.name)" class="text-red-600">
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
                                            @click.stop="onCopy(secret.name)"
                                            class="min-w-0 inline-flex items-center gap-1 text-xs ml-4 text-muted-foreground hover:text-foreground transition-all duration-200 opacity-0 group-hover:opacity-100"
                                            :aria-label="copiedName === secret.name ? 'Copied' : 'Copy name'"
                                            :title="copiedName === secret.name ? 'Copied' : 'Copy name'"
                                        >
                                            <component :is="copiedName === secret.name ? Check : Copy" class="h-4 w-4" />
                                            <span v-if="copiedName === secret.name" class="text-xs ml-1 max-w-48 truncate align-middle"
                                                >Copied</span
                                            >
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell class="group">
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono bg-muted px-2 py-1 rounded text-sm">{{ secret.valueFrom }}</span>
                                        <button
                                            @click.stop="onCopy(secret.valueFrom)"
                                            class="inline-flex items-center gap-1 whitespace-nowrap invisible group-hover:visible text-muted-foreground hover:text-foreground transition-all duration-200"
                                            :aria-label="copiedValue === secret.valueFrom ? 'Copied' : 'Copy value'"
                                            :title="copiedValue === secret.valueFrom ? 'Copied' : 'Copy value'"
                                        >
                                            <component :is="copiedValue === secret.valueFrom ? Check : Copy" class="h-4 w-4" />
                                            <span
                                                v-if="copiedValue === secret.valueFrom"
                                                class="text-xs ml-1 max-w-48 truncate align-middle"
                                                >Copied</span
                                            >
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
        :cluster-name="service.clusterName"
        :service-name="service.name"
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
import { Check, Copy, EditIcon, GlobeIcon, KeyIcon, MoreHorizontalIcon, SettingsIcon, TrashIcon } from 'lucide-vue-next';
import { computed, reactive, ref } from 'vue';
import { copyToClipboard as copyToClipboardHelper } from '@/composables/useClipboard';
import { AwsService } from '@/services/aws.service';
import EditEnvironmentVariableDialog from './EditEnvironmentVariableDialog.vue';
import type { RemoveEnvironmentVariablesInput } from '@/views/AWS/Services/components/environment-variable.schema';
import SecretsComparisonDialog from '@/views/AWS/Services/components/EnvironmentVariablesComparison/SecretsComparisonDialog.vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from '@/stores/dataStore.ts';
import { useRouter } from 'vue-router';

const router = useRouter();
const { services } = storeToRefs(useDataStore());
const { toast } = useToast();
const awsService = new AwsService();

const props = defineProps<{
    service: ServiceInterface;
    container: ContainerInterface;
}>();

const emit = defineEmits<{
    (e: 'refresh'): void;
}>();

const editDialog = reactive({
    isOpen: false,
    variableName: '',
    currentValue: '',
    type: 'environment' as 'environment' | 'secret',
});

const copiedName = ref<string | null>(null);
const copiedValue = ref<string | null>(null);

const onCopy = async (text: string) => {
    const ok = await copyToClipboardHelper(text);
    if (!ok) return;
    if (text) {
        // set both to support either field
        copiedName.value = text;
        copiedValue.value = text;
        setTimeout(() => {
            if (copiedName.value === text) copiedName.value = null;
            if (copiedValue.value === text) copiedValue.value = null;
        }, 2000);
    }
};

const addDialog = reactive({
    isOpen: false,
});

const sortedEnvironmentVariables = computed(() => {
    return [...props.container.environmentVariables.environment].sort((a, b) => a.name.localeCompare(b.name));
});

const sortedSecrets = computed(() => {
    return [...props.container.environmentVariables.secrets].sort((a, b) => a.name.localeCompare(b.name));
});

const openEditDialog = (variable: { name: string; value: string }) => {
    editDialog.variableName = variable.name;
    editDialog.currentValue = variable.value;
    editDialog.isOpen = true;
};

const deleteVariable = async (variableName: string) => {
    try {
        const payload: RemoveEnvironmentVariablesInput = {
            clusterName: props.service.clusterName,
            serviceName: props.service.name,
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

const goToCentral = () => {
    // Navigate to environment page with service information to auto-open the dialog
    router.push({
        path: '/aws/environment',
        query: {
            openService: props.service.name,
            clusterName: props.service.clusterName,
        },
    });
};

const handleRefresh = () => {
    emit('refresh');
};
</script>
