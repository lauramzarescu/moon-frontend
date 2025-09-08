<template>
    <Button
        v-if="!hideTrigger"
        :variant="isClusterProduction ? 'destructive' : 'outline'"
        size="default"
        :class="[
            'px-4 py-2 gap-2 transition-all duration-200 hover:shadow-sm group',
            isClusterProduction &&
                'border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900',
        ]"
        @click="
            isDialogOpen = true;
            emit('dialog-open');
        "
        :disabled="!hasPermission(PermissionEnum.AWS_SERVICE_WRITE)"
    >
        <ShieldAlertIcon v-if="isClusterProduction" class="h-4 w-4 transition-transform duration-200" />
        <Edit2Icon v-else class="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
        <span class="text-sm">{{ isClusterProduction ? 'Update Production' : 'Update Image' }}</span>
    </Button>

    <Dialog v-model:open="isDialogOpen">
        <DialogContent :class="['sm:max-w-[800px]']">
            <DialogHeader>
                <DialogTitle :class="['flex items-center gap-2', isClusterProduction && 'text-red-700 dark:text-red-300']">
                    <AlertTriangleIcon v-if="isClusterProduction && isConfirming" class="h-5 w-5 text-red-600" />
                    <ShieldAlertIcon v-else-if="isClusterProduction" class="h-5 w-5 text-red-600" />
                    {{ getDialogTitle() }}
                </DialogTitle>
                <DialogDescription :class="[isClusterProduction && isConfirming && 'text-red-600 dark:text-red-400']">
                    {{ getDialogDescription() }}
                </DialogDescription>

                <!-- Production Warning Banner -->
                <div
                    v-if="isClusterProduction"
                    class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800"
                >
                    <div class="flex items-center gap-2">
                        <AlertTriangleIcon class="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span class="text-sm font-medium text-red-800 dark:text-red-200">Production Environment</span>
                    </div>
                    <p class="text-xs text-red-700 dark:text-red-300 mt-1">
                        You are updating a service in a production cluster. Please proceed with caution.
                    </p>
                </div>
            </DialogHeader>

            <!-- Form Content -->
            <div v-if="!isConfirming" class="mx-auto w-full">
                <div class="space-y-4">
                    <div class="space-y-2">
                        <Label for="current-image" class="text-sm font-medium">Current Image</Label>
                        <Input id="current-image" :model-value="currentImage" disabled class="bg-muted font-mono text-xs" />
                    </div>
                    <div class="space-y-2">
                        <Label for="new-image" class="flex items-center justify-between text-sm font-medium">
                            New Image URI
                            <span v-if="validationError" class="text-xs text-destructive">{{ validationError }}</span>
                        </Label>
                        <div class="flex gap-2">
                            <Input
                                id="new-image"
                                :default-value="currentImage"
                                v-model="newImageUri"
                                placeholder="Enter new image URI"
                                :class="['font-mono text-xs', { 'border-destructive': validationError }]"
                            />
                            <SplitButton
                                :button-text="fetchButtonText"
                                loading-text="Fetching..."
                                :loading="commitLoading"
                                :disabled="fetchButtonDisabled"
                                variant="outline"
                                button-class="group"
                                dropdown-align="end"
                                :title="fetchButtonTitle"
                                @click="handleFetchCommit"
                            >
                                <template #icon>
                                    <GithubIcon class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                </template>
                                <template #dropdown-content>
                                    <template v-if="repoLinkId && (availableMainBranch || pullRequests.length > 0)">
                                        <!-- Main Branch (main or master) -->
                                        <DropdownMenuItem
                                            v-if="availableMainBranch"
                                            :key="`branch-${availableMainBranch}`"
                                            @click="selectedPullRequest = availableMainBranch"
                                            :class="{ 'bg-accent': selectedPullRequest === availableMainBranch }"
                                        >
                                            <div class="flex items-center justify-between w-full">
                                                <div class="flex flex-col items-start">
                                                    <span class="font-medium">{{ availableMainBranch }}</span>
                                                    <span class="text-xs text-muted-foreground">Main branch</span>
                                                </div>
                                                <span
                                                    v-if="selectedPullRequest === availableMainBranch"
                                                    class="text-xs text-muted-foreground"
                                                    >✓</span
                                                >
                                            </div>
                                        </DropdownMenuItem>

                                        <!-- Separator if we have both main branch and PRs -->
                                        <div v-if="availableMainBranch && pullRequests.length > 0" class="border-t my-1"></div>

                                        <!-- Pull Requests -->
                                        <DropdownMenuItem
                                            v-for="pr in pullRequests"
                                            :key="pr.id"
                                            @click="selectedPullRequest = pr.head.ref"
                                            :class="{ 'bg-accent': selectedPullRequest === pr.head.ref }"
                                        >
                                            <div class="flex items-center justify-between w-full">
                                                <div class="flex flex-col items-start">
                                                    <span class="font-medium">{{ pr.title }}</span>
                                                    <span class="text-xs text-muted-foreground"
                                                        >{{ pr.head.ref }} • PR #{{ pr.number }}</span
                                                    >
                                                </div>
                                                <span v-if="selectedPullRequest === pr.head.ref" class="text-xs text-muted-foreground"
                                                    >✓</span
                                                >
                                            </div>
                                        </DropdownMenuItem>
                                    </template>
                                    <template v-else-if="pullRequestsLoading">
                                        <DropdownMenuItem disabled>
                                            <Loader2Icon class="w-4 h-4 mr-2 animate-spin" />
                                            Loading pull requests...
                                        </DropdownMenuItem>
                                    </template>
                                    <template v-else-if="!repoLinkId">
                                        <DropdownMenuItem disabled> No repository linked </DropdownMenuItem>
                                    </template>
                                    <template v-else>
                                        <DropdownMenuItem disabled> No branches or pull requests found </DropdownMenuItem>
                                    </template>
                                </template>
                            </SplitButton>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Confirmation Content -->
            <div v-else class="mx-auto w-full">
                <div class="space-y-4">
                    <!-- Service Information -->
                    <div class="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div class="space-y-1">
                            <Label class="text-xs text-muted-foreground">Service</Label>
                            <p class="text-sm font-medium">{{ serviceName }}</p>
                        </div>
                        <div class="space-y-1">
                            <Label class="text-xs text-muted-foreground">Cluster</Label>
                            <p class="text-sm font-medium flex items-center gap-1">
                                {{ clusterName }}
                                <ShieldAlertIcon v-if="isClusterProduction" class="h-3 w-3 text-red-600" />
                            </p>
                        </div>
                        <div class="space-y-1 col-span-2">
                            <Label class="text-xs text-muted-foreground">Container</Label>
                            <p class="text-sm font-medium">{{ containerName }}</p>
                        </div>
                    </div>

                    <!-- Image Comparison -->
                    <div class="space-y-3">
                        <Label class="text-sm font-medium">Image Changes</Label>
                        <div class="space-y-2">
                            <div
                                class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800"
                            >
                                <span class="text-red-600 text-xs font-medium">FROM:</span>
                                <code class="text-xs text-red-700 dark:text-red-300 break-all">{{ currentImage }}</code>
                            </div>
                            <div
                                class="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950 dark:border-green-800"
                            >
                                <span class="text-green-600 text-xs font-medium">TO:</span>
                                <code class="text-xs text-green-700 dark:text-green-300 break-all">{{ newImageUri }}</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="handleClose">
                    {{ isConfirming ? 'Back' : 'Cancel' }}
                </Button>
                <Button
                    type="submit"
                    @click="isConfirming ? handleSubmit() : showConfirmation()"
                    :disabled="isLoading || (!isConfirming && (!newImageUri || !!validationError))"
                    :variant="isConfirming && isClusterProduction ? 'destructive' : 'default'"
                    :class="[isConfirming && isClusterProduction && 'bg-red-600 hover:bg-red-700 border-red-600']"
                >
                    <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    <AlertTriangleIcon v-else-if="isConfirming && isClusterProduction" class="w-4 h-4 mr-2" />
                    {{ buttonText }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangleIcon, Edit2Icon, GithubIcon, Loader2Icon, ShieldAlertIcon } from 'lucide-vue-next';
import { AwsService } from '@/services/aws.service.ts';
import { serviceUpdateImageSchema } from '../components/schema.ts';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';
import { GithubService } from '@/services/github.service.ts';
import type { GithubPullRequest, ServiceRepositoryRecord } from '@/services/github/schema.ts';
import { SplitButton } from '@/components/ui/split-button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';

const githubService = new GithubService();
const commitLoading = ref(false);
const commitError = ref('');
const repoLinkId = ref<string | null>(null);
const repoLinkLoading = ref(false);
const repoInfo = ref<ServiceRepositoryRecord | null>(null);
const pullRequests = ref<GithubPullRequest[]>([]);
const pullRequestsLoading = ref(false);
const selectedPullRequest = ref<string>('');
const availableMainBranch = ref<string>(''); // Will be set to 'main' or 'master' based on what's available

// Function to detect branch/PR from current image
const detectCurrentBranchFromImage = (imageUri: string): string => {
    if (!imageUri) return '';

    // Extract tag from image URI (everything after the last colon)
    const parts = imageUri.split(':');
    if (parts.length < 2) return '';

    const tag = parts[parts.length - 1];

    // Check if tag contains branch name with commit SHA (e.g., "main-e224449")
    const branchCommitMatch = tag.match(/^(.+)-([a-f0-9]{7,})$/i);
    if (branchCommitMatch) {
        const [, branchName] = branchCommitMatch;
        return branchName;
    }

    // If tag looks like a commit SHA (7+ hex characters), try to find matching PR
    if (/^[a-f0-9]{7,}$/i.test(tag)) {
        const matchingPR = pullRequests.value.find((pr) => pr.head.sha.startsWith(tag));
        if (matchingPR) {
            return matchingPR.head.ref;
        }
    }

    // If tag matches a branch name directly
    const allBranches = [availableMainBranch.value, ...pullRequests.value.map((pr) => pr.head.ref)].filter(Boolean);
    if (allBranches.includes(tag)) {
        return tag;
    }

    // Default to available main branch
    return availableMainBranch.value || 'main';
};

const { hasPermission } = usePermissions();
const props = defineProps<{
    currentImage: string;
    containerName: string;
    clusterName: string;
    serviceName: string;
    serviceArn?: string;
    isClusterProduction: boolean;
    hideTrigger?: boolean;
    open?: boolean;
    confirmOnly?: boolean;
    defaultNewImageUri?: string;
}>();
const emit = defineEmits<{
    (e: 'image-updated'): void;
    (e: 'dialog-close'): void;
    (e: 'dialog-open'): void;
    (e: 'update:open', value: boolean): void;
}>();

const loadRepoLink = async () => {
    if (!props.serviceArn) {
        repoLinkId.value = null;
        repoInfo.value = null;
        return;
    }

    try {
        repoLinkLoading.value = true;
        const links = await githubService.listServiceRepositories();
        const found = links.find((l: ServiceRepositoryRecord) => l.serviceArn === props.serviceArn);

        repoLinkId.value = found?.id ?? null;
        repoInfo.value = found ?? null;

        if (found) {
            await loadPullRequests();
        }
    } catch (e) {
        repoLinkId.value = null;
        repoInfo.value = null;
    } finally {
        repoLinkLoading.value = false;
    }
};

const loadPullRequests = async () => {
    if (!repoInfo.value) return;

    try {
        pullRequestsLoading.value = true;
        const repoName = `${repoInfo.value.repo}`;

        const response = await githubService.getPullRequests(repoName);
        const { openPullRequests, branches } = response;

        pullRequests.value = openPullRequests;

        // Determine which main branch is available (prefer main over master)
        const mainBranch = branches.find((b) => b.name === 'main');
        const masterBranch = branches.find((b) => b.name === 'master');
        availableMainBranch.value = mainBranch?.name || masterBranch?.name || 'main';

        // Try to detect current branch/PR from image
        const detectedBranch = detectCurrentBranchFromImage(props.currentImage);

        if (detectedBranch) {
            selectedPullRequest.value = detectedBranch;
        } else {
            // Set default to available main branch, then first open pull request
            selectedPullRequest.value = availableMainBranch.value;
            const firstOpenPR = pullRequests.value.find((pr) => pr.state === 'open');
            if (firstOpenPR) {
                selectedPullRequest.value = firstOpenPR.head.ref;
            }
        }
    } catch (e) {
        console.error('Failed to load pull requests:', e);
        pullRequests.value = [];
        availableMainBranch.value = 'main';
        selectedPullRequest.value = 'main'; // Default to main on error
    } finally {
        pullRequestsLoading.value = false;
    }
};

const isDialogOpen = ref(false);
const isConfirming = ref(false);
const newImageUri = ref('');
const isLoading = ref(false);
const validationError = ref('');
const awsService = new AwsService();

watch(
    () => props.open,
    (val) => {
        isDialogOpen.value = val;
    },
    { immediate: true },
);

watch(isDialogOpen, (val) => emit('update:open', val));

watch(newImageUri, (value) => {
    try {
        serviceUpdateImageSchema.parse({
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.containerName,
            newImageUri: value,
            oldImageUri: props.currentImage,
        });
        validationError.value = '';
    } catch (error: unknown) {
        const err = error as { errors?: Array<{ message: string }> };

        if (err?.errors && err.errors.length > 0) {
            validationError.value = err.errors[0].message;
        } else {
            validationError.value = 'Invalid input';
        }
    }
});

const buttonText = computed(() => {
    if (isLoading.value) return 'Updating...';
    if (isConfirming.value) {
        return props.isClusterProduction ? 'Confirm Production Update' : 'Confirm Update';
    }
    return 'Update Image';
});

const fetchButtonText = computed(() => {
    if (selectedPullRequest.value) {
        const pr = pullRequests.value.find((p) => p.head.ref === selectedPullRequest.value);
        if (pr) {
            return `Fetch ${pr.title}`;
        }
        // If it's the main branch, show branch name
        if (selectedPullRequest.value === availableMainBranch.value) {
            return `Fetch ${selectedPullRequest.value}`;
        }
        return `Fetch ${selectedPullRequest.value}`;
    }
    return 'Fetch Latest Commit';
});

const fetchButtonDisabled = computed(() => {
    return !repoLinkId.value || repoLinkLoading.value || pullRequestsLoading.value || !selectedPullRequest.value;
});

const fetchButtonTitle = computed(() => {
    if (!repoLinkId.value) return 'Link a repository to enable commit fetching';
    if (repoLinkLoading.value) return 'Loading repository information...';
    if (pullRequestsLoading.value) return 'Loading pull requests...';
    if (!selectedPullRequest.value) return 'Select a branch or pull request to fetch from';

    // Check if it's the main branch
    if (selectedPullRequest.value === availableMainBranch.value) {
        return `Fetch latest commit from ${selectedPullRequest.value} branch`;
    }

    // Check if it's a PR
    const pr = pullRequests.value.find((p) => p.head.ref === selectedPullRequest.value);
    return pr ? `Fetch latest commit from PR "${pr.title}" (${pr.head.ref})` : `Fetch latest commit from ${selectedPullRequest.value}`;
});

const handleFetchCommit = async () => {
    if (!selectedPullRequest.value || !repoLinkId.value) {
        toast({ title: 'No selection', description: 'Please select a branch or pull request to fetch from', variant: 'destructive' });
        return;
    }

    commitError.value = '';
    commitLoading.value = true;

    try {
        const id = repoLinkId.value as string;
        const branchName = selectedPullRequest.value;

        let commit;

        // Handle main branch differently
        if (branchName === availableMainBranch.value) {
            commit = await githubService.getLatestCommitForService(id);
        } else {
            commit = await githubService.getLatestCommitForServiceBranch(id, branchName);
        }

        if (!commit?.sha) {
            throw new Error('No commit found');
        }

        const short = commit.sha.substring(0, 7);

        // Build new image URI with proper branch and commit
        const currentImageParts = (newImageUri.value || props.currentImage).split(':');
        const baseImage = currentImageParts[0];

        // Create new tag with branch name and commit SHA
        const newTag = `${branchName}-${short}`;
        newImageUri.value = `${baseImage}:${newTag}`;

        // Determine display name
        let displayName = branchName;
        if (branchName === availableMainBranch.value) {
            displayName = `${branchName} branch`;
        } else {
            const pr = pullRequests.value.find((p) => p.head.ref === selectedPullRequest.value);
            displayName = pr ? `PR "${pr.title}"` : branchName;
        }

        toast({
            title: 'Commit fetched successfully',
            description: `Latest commit from ${displayName}: ${short}`,
            variant: 'default',
        });
    } catch (e: any) {
        toast({ title: 'Failed to fetch commit', description: e?.message || 'Unexpected error', variant: 'destructive' });
        commitError.value = e?.message || 'Failed to fetch latest commit';
    } finally {
        commitLoading.value = false;
    }
};

const getDialogTitle = () => {
    if (isConfirming.value) {
        return props.isClusterProduction ? 'Confirm Production Image Update' : 'Confirm Image Update';
    }
    return props.isClusterProduction ? 'Update Production Container Image' : 'Update Container Image';
};

const getDialogDescription = () => {
    if (isConfirming.value) {
        const baseMessage = `Are you sure you want to update the image?`;
        if (props.isClusterProduction) {
            return `${baseMessage} This will affect a production service.`;
        }
        return baseMessage;
    }
    return 'Specify the new image URI for this container.';
};

const showConfirmation = () => {
    isConfirming.value = true;
};

const cancelConfirmation = () => {
    isConfirming.value = false;
};

const handleClose = () => {
    if (isConfirming.value) {
        cancelConfirmation();
    } else {
        isDialogOpen.value = false;
        newImageUri.value = props.currentImage;
        emit('dialog-close');
    }
};

const handleSubmit = async () => {
    try {
        isLoading.value = true;

        await awsService.updateServiceImage({
            clusterName: props.clusterName,
            serviceName: props.serviceName,
            containerName: props.containerName,
            newImageUri: newImageUri.value,
            oldImageUri: props.currentImage,
        });

        emit('image-updated');
        isDialogOpen.value = false;
        isConfirming.value = false;
        emit('dialog-close');
    } catch (error) {
        console.error('Failed to update image:', error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadRepoLink();
    newImageUri.value = props.defaultNewImageUri ?? props.currentImage;
});

watch(isDialogOpen, (open) => {
    loadRepoLink();
    if (open && props.confirmOnly) {
        isConfirming.value = true;
    }
});
</script>
