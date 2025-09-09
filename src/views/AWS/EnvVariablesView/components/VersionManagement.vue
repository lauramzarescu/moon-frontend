<template>
    <div class="flex items-center justify-between gap-3 pt-3 pb-3">
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
                <Label class="text-sm font-medium">Version:</Label>
                <Select :model-value="selectedVersion" @update:model-value="$emit('update:selectedVersion', $event)" :disabled="isLoadingVersions">
                    <SelectTrigger class="w-[260px]">
                        <SelectValue>
                            <div v-if="isLoadingVersions" class="flex items-center gap-2">
                                <Loader2Icon class="h-3 w-3 animate-spin" />
                                Loading...
                            </div>
                            <span v-else>
                                {{
                                    availableVersions.find((v) => v.revision.toString() === selectedVersion)?.label ||
                                    'Select version'
                                }}
                            </span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem
                                v-for="(version, idx) in availableVersions"
                                :key="version.revision"
                                :value="version.revision.toString()"
                            >
                                <div class="flex items-center justify-between gap-3">
                                    <span>{{ version.label }}</span>
                                    <Badge v-if="idx === 0" variant="outline" class="text-[10px]">Latest</Badge>
                                </div>
                            </SelectItem>

                            <!-- Load More Button -->
                            <div v-if="pagination?.hasNextPage" class="p-2 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    @click="$emit('load-more')"
                                    :disabled="isLoadingMoreVersions"
                                    class="w-full text-xs h-8"
                                >
                                    <Loader2Icon v-if="isLoadingMoreVersions" class="h-3 w-3 mr-2 animate-spin" />
                                    <span v-else>Load More ({{ pagination.totalPages - pagination.page }} pages left)</span>
                                </Button>
                            </div>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <Button
                size="sm"
                variant="outline"
                @click="$emit('compare')"
                class="hover:shadow-sm transition-all duration-200"
            >
                <GitCompareIcon class="h-4 w-4 mr-2" />
                Compare
            </Button>
            <Button
                v-if="selectedVersion && selectedVersion !== availableVersions[0]?.revision.toString()"
                size="sm"
                variant="outline"
                @click="$emit('restore')"
                class="hover:shadow-sm group transition-all duration-200"
            >
                <RefreshCwIcon class="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                Restore to this version
            </Button>
        </div>

        <div class="flex items-center gap-2">
            <Button
                size="sm"
                variant="outline"
                :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
                @click="$emit('add-variable')"
                class="hover:shadow-sm transition-all duration-200"
            >
                <PlusIcon class="h-4 w-4 mr-2" />
                Add Variable
            </Button>
            <Button
                size="sm"
                variant="outline"
                :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
                @click="$emit('bulk-operations')"
                class="hover:shadow-sm transition-all duration-200"
            >
                <SettingsIcon class="h-4 w-4 mr-2" />
                Bulk Operations
            </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCompareIcon, Loader2Icon, PlusIcon, RefreshCwIcon, SettingsIcon } from 'lucide-vue-next';
import { PermissionEnum } from '@/enums/user/user.enum.ts';
import { usePermissions } from '@/composables/usePermissions.ts';

interface Props {
    selectedVersion: string;
    availableVersions: Array<{ revision: number; label: string; arn: string; registeredAt: string }>;
    isLoadingVersions: boolean;
    isLoadingMoreVersions?: boolean;
    pagination?: { page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } | null;
}

interface Emits {
    (e: 'update:selectedVersion', value: string): void;
    (e: 'compare'): void;
    (e: 'restore'): void;
    (e: 'add-variable'): void;
    (e: 'bulk-operations'): void;
    (e: 'load-more'): void;
}

defineProps<Props>();
defineEmits<Emits>();

const { hasPermission } = usePermissions();
</script>
