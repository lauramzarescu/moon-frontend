<script setup lang="ts">
import { Sidebar, SidebarContent, SidebarHeader, type SidebarProps, SidebarRail } from '@/components/ui/sidebar';
import { BlocksIcon, CalendarClockIcon, Clock, PackageIcon, SettingsIcon } from 'lucide-vue-next';
import TeamSwitcher from '@/components/Sidebar/components/TeamSwitcher.vue';
import NavAws from '@/components/Sidebar/components/NavAws.vue';
import { MoonIcon } from '@radix-icons/vue';
import { ServerStackIcon } from '@heroicons/vue/16/solid';

const props = defineProps<SidebarProps>();

const data = {
    teams: [
        {
            name: 'Moon',
            logo: MoonIcon,
            plan: 'Enterprise',
        },
    ],
    navAws: [
        {
            title: 'Inventory',
            url: '/aws/inventory',
            icon: PackageIcon,
        },
        {
            title: 'Clusters',
            url: '/aws/clusters',
            icon: ServerStackIcon,
        },
        {
            title: 'Services',
            url: '/aws/services',
            icon: BlocksIcon,
        },
        {
            title: 'Env Variables',
            url: '/aws/env-variables',
            icon: SettingsIcon,
        },
        {
            title: 'Timeline',
            url: '/aws/timeline',
            icon: Clock,
        },
        {
            title: 'GitHub Links',
            url: '/aws/github-links',
            icon: ServerStackIcon,
        },
        {
            title: 'Scheduled Tasks',
            url: '/aws/scheduled-tasks',
            icon: CalendarClockIcon,
            badge: '10',
        },
    ],
    navDigitalOcean: [],
    navGCP: [],
    favorites: [],
    workspaces: [],
};
</script>

<template>
    <Sidebar class="border-r-0" v-bind="props">
        <SidebarHeader>
            <TeamSwitcher :teams="data.teams" />
            <NavAws :items="data.navAws" />
        </SidebarHeader>
        <SidebarContent>
            <!--            <NavFavorites :favorites="data.favorites" />-->
            <!--            <NavWorkspaces :workspaces="data.workspaces" />-->
            <!--            <NavSecondary :items="data.navSecondary" class="mt-auto" />-->
        </SidebarContent>
        <SidebarRail />
    </Sidebar>
</template>
