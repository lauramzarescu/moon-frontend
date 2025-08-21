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
                                    <template #icon> </template>
                                </CustomWidget>

                                <CustomWidget class="col-span-3" title="Memory" :value="container.memory ?? 'N/A'" :icon="MemoryStickIcon">
                                </CustomWidget>

                                <CustomWidget class="col-span-3" title="CPU" :value="container.cpu ?? 'N/A'" :icon="CpuIcon">
                                </CustomWidget>
                            </div>

                            <!-- Replace the old Environment Variables Card with SecretsTable -->
                            <SecretsTable
                                :container="container"
                                :service="props.row"
                                :all-services="services"
                                @refresh="$emit('refresh')"
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </div>
        </div>
    </Card>
</template>

<script setup lang="ts" generic="TData extends ServiceInterface">
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContainerIcon, CpuIcon, ImageIcon, MemoryStickIcon } from 'lucide-vue-next';
import CustomWidget from '@/components/ui/custom-widget/CustomWidget.vue';
import SecretsTable from './SecretsTable.vue';
import { ref } from 'vue';
import { useDataStore } from '@/stores/dataStore.ts';
import { storeToRefs } from 'pinia';

const props = defineProps<{
    row: TData;
    isOpen?: boolean;
}>();

const emit = defineEmits<{
    (e: 'refresh'): void;
}>();

const isDialogOpen = ref(false);
const { services } = storeToRefs(useDataStore());

const handleDialogToggle = (isOpen: boolean) => {
    isDialogOpen.value = isOpen;
};
</script>
