<script setup lang="ts">
import { ref, watch } from 'vue';
import { ActionTypeEnum, actionTypeLabels } from './schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Filter, Search } from 'lucide-vue-next';

defineProps<{
    actionsCount: number;
}>();

const searchQuery = ref('');
const selectedFilter = ref<string | null>(null);

const emit = defineEmits<{
    (e: 'filter-change', query: string, filter: string | null): void;
}>();

const actionTypes = [
    {
        value: ActionTypeEnum.add_inbound_rule,
        label: actionTypeLabels[ActionTypeEnum.add_inbound_rule],
    },
    {
        value: ActionTypeEnum.remove_inbound_rule,
        label: actionTypeLabels[ActionTypeEnum.remove_inbound_rule],
    },
    {
        value: ActionTypeEnum.remove_all_inbound_rules,
        label: actionTypeLabels[ActionTypeEnum.remove_all_inbound_rules],
    },
    {
        value: ActionTypeEnum.send_email_notification,
        label: actionTypeLabels[ActionTypeEnum.send_email_notification],
    },
    {
        value: ActionTypeEnum.send_slack_notification,
        label: actionTypeLabels[ActionTypeEnum.send_slack_notification],
    },
];

const updateFilters = () => {
    emit('filter-change', searchQuery.value, selectedFilter.value);
};

const clearFilters = () => {
    searchQuery.value = '';
    selectedFilter.value = null;
    updateFilters();
};

// Watch for changes and emit events
watch([searchQuery, selectedFilter], () => {
    updateFilters();
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Defined Actions ({{ actionsCount }})</h3>
            <div class="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" class="h-9">
                            <Filter class="h-4 w-4 mr-2" />
                            {{ selectedFilter ? actionTypeLabels[selectedFilter as ActionTypeEnum] : 'Filter' }}
                            <ChevronDown class="h-4 w-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="w-[200px]">
                        <DropdownMenuItem @click="selectedFilter = null" :class="{ 'bg-muted': selectedFilter === null }">
                            All Types
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            v-for="type in actionTypes"
                            :key="type.value"
                            @click="selectedFilter = type.value"
                            :class="{ 'bg-muted': selectedFilter === type.value }"
                        >
                            {{ type.label }}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div class="relative">
                    <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-foreground" />
                    <Input v-model="searchQuery" placeholder="Search actions..." class="pl-8 h-9 w-[200px] md:w-[260px]" />
                </div>
            </div>
        </div>

        <div v-if="searchQuery || selectedFilter" class="flex items-center gap-2">
            <span class="text-sm text-foreground">Filters:</span>
            <Badge v-if="selectedFilter" variant="outline" class="flex items-center gap-1">
                {{ actionTypeLabels[selectedFilter as ActionTypeEnum] }}
                <button @click="selectedFilter = null" class="ml-1 hover:text-primary">×</button>
            </Badge>
            <Badge v-if="searchQuery" variant="outline" class="flex items-center gap-1">
                "{{ searchQuery }}"
                <button @click="searchQuery = ''" class="ml-1 hover:text-primary">×</button>
            </Badge>
            <Button variant="ghost" size="sm" @click="clearFilters" class="h-7 text-xs">Clear all</Button>
        </div>
    </div>
</template>
