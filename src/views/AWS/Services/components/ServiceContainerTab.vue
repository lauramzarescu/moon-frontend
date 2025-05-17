<template>
    <Card class="overflow-hidden border-none" :inert="isDialogOpen">
        <div class="flex">
            <div class="w-2 h-full bg-primary"></div>
            <div class="flex-1">
                <CardHeader class="py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="p-2 rounded-lg bg-primary/10">
                                <ContainerIcon class="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle class="text-base">Container Configuration</CardTitle>
                                <CardDescription class="text-xs">Resources and Environment Variables</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Tabs default-value="container-0">
                        <TabsList class="inline-flex p-1 bg-card dark:bg-card border rounded-xl">
                            <TabsTrigger
                                v-for="(container, index) in props.row.containers"
                                :key="container.name"
                                :value="`container-${index}`"
                                class="flex items-center px-3 py-1 rounded-lg transition-all hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary mr-1 last:mr-0"
                            >
                                <div class="flex items-center gap-2">
                                    <div class="p-1.5 bg-muted rounded-md">
                                        <ContainerIcon class="w-3.5 h-3.5 text-foreground" />
                                    </div>
                                    <span class="font-medium text-sm">{{ container.name }}</span>
                                    <span
                                        class="flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-muted text-foreground"
                                    >
                                        {{ index + 1 }}
                                    </span>
                                </div>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            v-for="(container, index) in props.row.containers"
                            :key="container.name"
                            :value="`container-${index}`"
                            class="space-y-4 mt-4"
                        >
                            <!-- Resource Widgets -->
                            <div class="grid grid-cols-12 gap-4">
                                <CustomWidget class="col-span-6" title="Image" :value="container.image ?? 'N/A'" :icon="ImageIcon">
                                    <template #icon>
                                        <UpdateServiceImageDialog
                                            :current-image="container.image"
                                            :container-name="container.name"
                                            :cluster-name="props.row.clusterName"
                                            :service-name="props.row.name"
                                            @image-updated="$emit('refresh')"
                                            @dialog-open="handleDialogToggle(true)"
                                            @dialog-close="handleDialogToggle(false)"
                                        />
                                    </template>
                                </CustomWidget>

                                <CustomWidget class="col-span-3" title="Memory" :value="container.memory ?? 'N/A'" :icon="MemoryStickIcon">
                                </CustomWidget>

                                <CustomWidget class="col-span-3" title="CPU" :value="container.cpu ?? 'N/A'" :icon="CpuIcon">
                                </CustomWidget>
                            </div>

                            <!-- Environment Variables Card -->
                            <Card class="overflow-hidden">
                                <div class="flex">
                                    <div class="w-2 h-full bg-primary"></div>
                                    <div class="flex-1">
                                        <CardHeader class="py-3">
                                            <div class="flex items-center gap-2">
                                                <div class="p-2 rounded-lg bg-primary/10">
                                                    <SettingsIcon class="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle class="text-base">Environment Variables</CardTitle>
                                                    <CardDescription class="text-xs">Configuration and Secrets </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow class="hover:bg-transparent">
                                                        <TableHead class="w-1/3 text-primary">Name</TableHead>
                                                        <TableHead class="w-2/3 text-primary">Value</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow
                                                        v-for="env in sortedEnvironmentVariables(container)"
                                                        :key="env.name"
                                                        class="hover:bg-muted/10"
                                                    >
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
                                                                <span class="font-mono bg-muted px-2 py-1 rounded text-sm">{{
                                                                    env.value
                                                                }}</span>
                                                                <button
                                                                    @click="copyToClipboard(env.value)"
                                                                    class="invisible group-hover:visible hover:text-primary transition-colors"
                                                                >
                                                                    <CopyIcon class="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow
                                                        v-for="secret in sortedSecrets(container)"
                                                        :key="secret.name"
                                                        class="hover:bg-muted/10"
                                                    >
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
                                                                <span class="font-mono bg-muted px-2 py-1 rounded text-sm">{{
                                                                    secret.value
                                                                }}</span>
                                                                <button
                                                                    @click="copyToClipboard(secret.value)"
                                                                    class="invisible group-hover:visible hover:text-primary transition-colors"
                                                                >
                                                                    <CopyIcon class="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts" generic="TData extends ServiceInterface">
import type { ContainerInterface, ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { ContainerIcon, CopyIcon, CpuIcon, GlobeIcon, ImageIcon, KeyIcon, MemoryStickIcon, SettingsIcon } from 'lucide-vue-next';
import CustomWidget from '@/components/ui/custom-widget/CustomWidget.vue';
import UpdateServiceImageDialog from './UpdateServiceImageDialog.vue';
import { ref } from 'vue';

const { toast } = useToast();
const props = defineProps<{
    row: TData;
    isOpen?: boolean;
}>();

const emit = defineEmits<{
    (e: 'refresh'): void;
}>();
const isDialogOpen = ref(false);

const handleDialogToggle = (isOpen: boolean) => {
    isDialogOpen.value = isOpen;
};

const sortedEnvironmentVariables = (container: ContainerInterface) => {
    return [...container.environmentVariables.environment].sort((a, b) => a.name.localeCompare(b.name));
};

const sortedSecrets = (container: any) => {
    return [...container.environmentVariables.secrets].sort((a, b) => a.name.localeCompare(b.name));
};

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
</script>
