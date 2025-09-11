<template>
    <div class="flex items-center gap-2">
        <Select v-model="selected" :disabled="loading" @update:model-value="onSelect">
            <SelectTrigger class="w-[260px] transition-all hover:shadow-sm">
                <SelectValue :placeholder="loading ? 'Loading repositories...' : placeholder"> </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Repositories</SelectLabel>
                    <SelectItem v-for="repo in repositories" :key="repo.id" :value="repo.name">
                        <div class="flex items-center gap-2">
                            <span class="text-sm">{{ repo.owner }}/{{ repo.name }}</span>
                            <span class="text-xs text-muted-foreground">({{ repo.default_branch }})</span>
                        </div>
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
        <Button v-if="linkLoading" size="icon" variant="ghost" class="animate-pulse" disabled>
            <Loader2Icon class="w-4 h-4 animate-spin" />
        </Button>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-vue-next';
import { toast } from '@/components/ui/toast/use-toast';
import { GithubService } from '@/services/github.service.ts';
import type { GithubRepository, ServiceRepositoryRecord } from '@/services/github/schema.ts';

const props = defineProps<{ serviceArn: string | undefined }>();

const githubService = new GithubService();
const repositories = ref<GithubRepository[]>([]);
const selected = ref<string | undefined>(undefined);
const loading = ref(false);
const linkLoading = ref(false);
const placeholder = computed(() => (selected.value ? selected.value : 'Link repository'));

const fetchRepos = async () => {
    loading.value = true;
    try {
        repositories.value = await githubService.listRepositories();
    } catch (e: any) {
        toast({ title: 'Failed to load repositories', description: e?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
        loading.value = false;
    }
};

const fetchExistingLink = async () => {
    try {
        const links = await githubService.listServiceRepositories();
        const found = links.find((l: ServiceRepositoryRecord) => l.serviceArn === props.serviceArn);
        if (found) selected.value = `${found.repo}`;
    } catch (e) {
        // ignore silently as page may not require it
    }
};

const onSelect = async (value: string) => {
    if (!props.serviceArn) return;
    linkLoading.value = true;
    try {
        await githubService.linkServiceRepository({ repo: value, serviceArn: props.serviceArn });
        selected.value = value;

        toast({
            variant: 'success',
            title: 'Repository linked',
            description: value,
        });
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to link repository',
            description: e?.message || 'Unexpected error',
        });
    } finally {
        linkLoading.value = false;
    }
};

onMounted(async () => {
    await fetchRepos();
    await fetchExistingLink();
});
</script>
