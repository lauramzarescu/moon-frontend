<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';

defineProps<{
    items: {
        title: string;
        url: string;
        icon: LucideIcon;
        isActive?: boolean;
    }[];
}>();

const router = useRouter();
const route = useRoute();
const activeButton = ref('');

const navigate = (route: string) => {
    activeButton.value = route;
    router.push(route);
};

onMounted(async () => {
    await router.isReady();
    activeButton.value = route.path;
});

watch(
    () => route.path,
    (newPath) => {
        activeButton.value = newPath;
    },
);
</script>

<template>
    <SidebarMenu>
        <SidebarMenuItem v-for="item in items" :key="item.title">
            <SidebarMenuButton as-child :is-active="item.isActive">
                <Button
                    :key="item.title"
                    :variant="activeButton === item.url ? 'secondary' : 'ghost'"
                    class="w-full justify-start"
                    @click="navigate(item.url)"
                >
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
                </Button>
            </SidebarMenuButton>
        </SidebarMenuItem>
    </SidebarMenu>
</template>
