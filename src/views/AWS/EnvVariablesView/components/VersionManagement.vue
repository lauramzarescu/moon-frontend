<template>
    <div class="flex items-center justify-between gap-3 pt-3 pb-3">
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
                <Label class="text-sm font-medium">Version:</Label>
                <VersionSelect
                  :model-value="selectedVersion"
                  @update:modelValue="$emit('update:selectedVersion', $event)"
                  :versions="availableVersions"
                  :is-loading="isLoadingVersions"
                  :is-loading-more="isLoadingMoreVersions"
                  :pagination="pagination"
                  @load-more="$emit('load-more')"
                />
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
import { Label } from '@/components/ui/label';
import { GitCompareIcon, PlusIcon, RefreshCwIcon, SettingsIcon } from 'lucide-vue-next';
import VersionSelect from './VersionSelect.vue';
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
