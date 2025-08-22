<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold tracking-tight">GitHub Repository Links</h1>
            <Button variant="outline" size="sm" class="transition-all hover:shadow-sm" @click="fetchLinks" :disabled="loading">
                <RefreshCwIcon class="w-4 h-4 mr-2" :class="loading && 'animate-spin'" />
                Refresh
            </Button>
        </div>

        <Card class="overflow-hidden">
            <CardHeader>
                <CardTitle class="text-base">Linked Services</CardTitle>
                <CardDescription>Manage AWS service-to-repository connections</CardDescription>
            </CardHeader>
            <CardContent>
                <div v-if="error" class="mb-4 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-sm">
                    {{ error }}
                </div>

                <div v-if="loading" class="grid gap-3">
                    <Skeleton class="h-10" />
                    <Skeleton class="h-10" />
                    <Skeleton class="h-10" />
                </div>

                <div v-else>
                    <Table v-if="links.length > 0">
                        <TableHeader>
                            <TableRow>
                                <TableHead class="w-[35%]">Service ARN</TableHead>
                                <TableHead class="w-[25%]">Owner</TableHead>
                                <TableHead class="w-[30%]">Repository</TableHead>
                                <TableHead class="text-right w-[10%]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow v-for="link in links" :key="link.id" class="transition-colors hover:bg-muted/40">
                                <TableCell>
                                    <code class="font-mono text-xs break-all">{{ link.serviceArn }}</code>
                                </TableCell>
                                <TableCell>{{ link.owner }}</TableCell>
                                <TableCell>
                                    <a
                                        :href="`https://github.com/${link.owner}/${link.repo}`"
                                        class="text-primary hover:underline"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {{ link.owner }}/{{ link.repo }}
                                    </a>
                                </TableCell>
                                <TableCell class="text-right">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        class="h-8 hover:shadow-sm"
                                        @click="unlink(link)"
                                        :disabled="unlinkingId === link.id"
                                    >
                                        <Loader2Icon v-if="unlinkingId === link.id" class="w-4 h-4 mr-2 animate-spin" />
                                        Unlink
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <Table v-else>
                        <TableBody>
                            <TableEmpty :colspan="4">
                                <div class="text-center space-y-1">
                                    <div class="text-sm font-medium">No repository links</div>
                                    <div class="text-xs text-muted-foreground">Create links from a service dialog or via API.</div>
                                </div>
                            </TableEmpty>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { GithubService, type ServiceRepositoryRecord } from '@/services/github.service.ts';
import { Loader2Icon, RefreshCwIcon } from 'lucide-vue-next';
import { toast } from '@/components/ui/toast/use-toast';

const githubService = new GithubService();
const links = ref<ServiceRepositoryRecord[]>([]);
const loading = ref(false);
const unlinkingId = ref<string | null>(null);
const error = ref('');

const fetchLinks = async () => {
    try {
        loading.value = true;
        error.value = '';
        links.value = await githubService.listServiceRepositories();
    } catch (e: any) {
        error.value = e?.message || 'Failed to load repository links';
    } finally {
        loading.value = false;
    }
};

const unlink = async (link: ServiceRepositoryRecord) => {
    try {
        unlinkingId.value = link.id;
        await githubService.deleteServiceRepository(link.id);
        links.value = links.value.filter((l) => l.id !== link.id);
        toast({ title: 'Unlinked', description: `${link.owner}/${link.repo} disconnected from service` });
    } catch (e: any) {
        toast({ title: 'Failed to unlink', description: e?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
        unlinkingId.value = null;
    }
};

onMounted(fetchLinks);
</script>

<style scoped></style>
