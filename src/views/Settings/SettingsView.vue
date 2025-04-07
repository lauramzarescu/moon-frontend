<template>
    <section class="p-4 w-full mx-auto">
        <h1 class="text-2xl font-bold mb-4">Settings</h1>
        <Tabs v-model="selectedTab" class="w-full">
            <TabsList class="bg-white dark:bg-background min-h-9 p-0 w-full justify-start overflow-hidden rounded-none">
                <template v-for="tab in tabs" :key="tab.value">
                    <TabsTrigger class="pb-3 data-[state=active]:shadow-none data-[state=active]:text-blue-500 relative" :value="tab.value">
                        {{ tab.label }}
                        <div
                            v-if="selectedTab === tab.value"
                            class="w-[calc(100%-24px)] h-0.5 bg-blue-500 absolute bottom-0 rounded-t-full"
                        />
                    </TabsTrigger>
                </template>
            </TabsList>

            <!-- Tab Content -->
            <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value" class="w-full">
                <component :is="tab.component" class="w-full" />
            </TabsContent>
        </Tabs>
    </section>
</template>

<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AccountView from '@/views/Settings/AccountView.vue';
import TeamView from '@/views/Settings/TeamView.vue';
import SAMLView from '@/views/Settings/SAMLView.vue';
import WorkspaceView from '@/views/Settings/WorkspaceView.vue';
import ActionsView from '@/views/Settings/ActionView.vue';

const route = useRoute();
const router = useRouter();

const tabs = [
    { label: 'Account', value: 'account', badge: 0, component: AccountView },
    { label: 'Team', value: 'team', badge: 0, component: TeamView },
    { label: 'Workspace', value: 'workspace', badge: 0, component: WorkspaceView },
    { label: 'Authentication', value: 'saml', badge: 0, component: SAMLView },
    { label: 'Actions', value: 'actions', badge: 0, component: ActionsView },
];

const selectedTab = ref('account');

onMounted(() => {
    const tabParam = route.query.tab as string;
    if (tabParam && tabs.some((tab) => tab.value === tabParam)) {
        selectedTab.value = tabParam;
    }
});

watch(selectedTab, (newTab) => {
    if (route.query.tab !== newTab) {
        router.replace({ query: { ...route.query, tab: newTab } });
    }
});
</script>
