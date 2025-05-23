<script setup lang="ts">
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

import { ChevronDown, Plus } from 'lucide-vue-next';
import { type Component, ref } from 'vue';

const props = defineProps<{
    teams: {
        name: string;
        logo: Component;
        plan: string;
    }[];
}>();

const activeTeam = ref(props.teams[0]);

const isDropdownDisabled = ref(true);
</script>

<template>
    <SidebarMenu>
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger as-child :disabled="isDropdownDisabled">
                    <SidebarMenuButton class="w-fit px-1.5">
                        <div
                            class="flex aspect-square size-5 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
                        >
                            <component :is="activeTeam.logo" class="size-3" />
                        </div>
                        <span class="truncate font-semibold">{{ activeTeam.name }}</span>
                        <ChevronDown v-if="!isDropdownDisabled" class="opacity-50" />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-64 rounded-lg" align="start" side="bottom" :side-offset="4">
                    <DropdownMenuLabel class="text-xs text-foreground"> Teams</DropdownMenuLabel>
                    <DropdownMenuItem v-for="(team, index) in teams" :key="team.name" class="gap-2 p-2" @click="activeTeam = team">
                        <div class="flex size-6 items-center justify-center rounded-sm border">
                            <component :is="team.logo" class="size-4 shrink-0" />
                        </div>
                        {{ team.name }}
                        <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem class="gap-2 p-2">
                        <div class="flex size-6 items-center justify-center rounded-md border bg-background">
                            <Plus class="size-4" />
                        </div>
                        <div class="font-medium text-foreground">Add team</div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    </SidebarMenu>
</template>
