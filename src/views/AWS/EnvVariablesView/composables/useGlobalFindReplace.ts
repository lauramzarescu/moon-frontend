import { computed, reactive, ref, watch, type Ref } from 'vue';
import { useToast } from '@/components/ui/toast';
import { AwsService } from '@/services/aws.service';
import { withDelay } from '@/utils';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';

export interface GlobalFindMatch {
    variableId: string;
    variableName: string;
    isSecret: boolean;
    container: string;
    serviceName: string;
    clusterName: string;
    originalValue: string;
    newValue: string;
    matches: Array<{
        index: number;
        length: number;
        text: string;
    }>;
}

export interface PendingChange {
    serviceName: string;
    clusterName: string;
    containerName: string;
    environmentVariables: Array<{ name: string; value: string; originalValue: string }>;
    secrets: Array<{ name: string; valueFrom: string; originalValue: string }>;
}

export function useGlobalFindReplace(services: Ref<ServiceInterface[]>) {
    const { toast } = useToast();
    const awsService = new AwsService();

    const findReplace = reactive({
        find: '',
        replace: '',
        caseSensitive: false,
        useRegex: false,
    });

    const isReplacing = ref(false);
    const pendingChanges = ref<Map<string, PendingChange>>(new Map());

    const findMatches = computed((): GlobalFindMatch[] => {
        if (!findReplace.find || services.value.length === 0) {
            return [];
        }

        const matches: GlobalFindMatch[] = [];

        services.value.forEach((service) => {
            service.containers.forEach((container) => {
                // Process environment variables
                container.environmentVariables.environment?.forEach((envVar) => {
                    const searchValue = envVar.value;
                    const foundMatches = findMatchesInText(searchValue, findReplace);

                    if (foundMatches.length > 0) {
                        const newValue = replaceInText(searchValue, findReplace);
                        matches.push({
                            variableId: `${service.clusterName}-${service.name}-${container.name}-env-${envVar.name}`,
                            variableName: envVar.name,
                            isSecret: false,
                            container: container.name,
                            serviceName: service.name,
                            clusterName: service.clusterName,
                            originalValue: searchValue,
                            newValue,
                            matches: foundMatches,
                        });
                    }
                });

                // Process secrets
                container.environmentVariables.secrets?.forEach((secret) => {
                    const searchValue = secret.valueFrom;
                    const foundMatches = findMatchesInText(searchValue, findReplace);

                    if (foundMatches.length > 0) {
                        const newValue = replaceInText(searchValue, findReplace);
                        matches.push({
                            variableId: `${service.clusterName}-${service.name}-${container.name}-secret-${secret.name}`,
                            variableName: secret.name,
                            isSecret: true,
                            container: container.name,
                            serviceName: service.name,
                            clusterName: service.clusterName,
                            originalValue: searchValue,
                            newValue,
                            matches: foundMatches,
                        });
                    }
                });
            });
        });

        return matches;
    });

    const replacePreview = computed(() => {
        const matches = findMatches.value;

        if (matches.length === 0) {
            return findReplace.find ? 'No matches found across all services' : 'Enter search text to preview changes';
        }

        const serviceCount = new Set(matches.map(m => `${m.clusterName}-${m.serviceName}`)).size;
        return `Found ${matches.length} variable(s) across ${serviceCount} service(s). ${getTotalMatches()} occurrence(s) will be replaced.`;
    });

    const getTotalMatches = (): number => {
        return findMatches.value.reduce((total, match) => total + match.matches.length, 0);
    };

    const buildPendingChanges = () => {
        const changes = new Map<string, PendingChange>();

        findMatches.value.forEach((match) => {
            const changeKey = `${match.clusterName}-${match.serviceName}-${match.container}`;

            if (!changes.has(changeKey)) {
                changes.set(changeKey, {
                    serviceName: match.serviceName,
                    clusterName: match.clusterName,
                    containerName: match.container,
                    environmentVariables: [],
                    secrets: [],
                });
            }

            const change = changes.get(changeKey)!;

            if (match.isSecret) {
                change.secrets.push({
                    name: match.variableName,
                    valueFrom: match.newValue,
                    originalValue: match.originalValue,
                });
            } else {
                change.environmentVariables.push({
                    name: match.variableName,
                    value: match.newValue,
                    originalValue: match.originalValue,
                });
            }
        });

        pendingChanges.value = changes;
        return changes;
    };

    const performReplace = async () => {
        if (findMatches.value.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Changes',
                description: 'No matches found to replace.',
            });
            return false;
        }

        isReplacing.value = true;
        const changes = buildPendingChanges();
        const totalServices = changes.size;
        let completedServices = 0;

        // Show initial progress toast
        toast({
            title: 'Applying global replace...',
            description: `Starting update of ${totalServices} service container(s)`,
            variant: 'default',
        });

        try {
            const updatePromises = Array.from(changes.values()).map(async (change) => {
                const result = await awsService.editEnvironmentVariables({
                    clusterName: change.clusterName,
                    serviceName: change.serviceName,
                    containerName: change.containerName,
                    environmentVariables: change.environmentVariables.map(env => ({ name: env.name, value: env.value })),
                    secrets: change.secrets.map(secret => ({ name: secret.name, valueFrom: secret.valueFrom })),
                });

                // Update progress
                completedServices++;
                const progressPercentage = Math.round((completedServices / totalServices) * 100);

                // Show progress update
                if (completedServices < totalServices) {
                    toast({
                        title: 'Applying global replace...',
                        description: `Updated ${completedServices} of ${totalServices} service containers (${progressPercentage}%)`,
                        variant: 'default',
                    });
                }

                return result;
            });

            await Promise.all(updatePromises);

            toast({
                title: 'Global Replace Successful',
                description: `Successfully replaced ${getTotalMatches()} occurrence(s) in ${findMatches.value.length} variable(s) across ${totalServices} service(s)`,
                variant: 'default',
            });

            return true;
        } catch (error: any) {
            console.error('Global replace operation failed:', error);
            toast({
                variant: 'destructive',
                title: 'Global Replace Failed',
                description: error.message || 'Failed to replace variables',
            });
            return false;
        } finally {
            isReplacing.value = false;
        }
    };

    const resetReplaceState = () => {
        findReplace.find = '';
        findReplace.replace = '';
        findReplace.caseSensitive = false;
        findReplace.useRegex = false;
        isReplacing.value = false;
        pendingChanges.value.clear();
    };

    // Watch for changes in findMatches and automatically build pending changes
    watch(findMatches, () => {
        if (findMatches.value.length > 0) {
            buildPendingChanges();
        } else {
            pendingChanges.value.clear();
        }
    }, { immediate: true });

    return {
        findReplace,
        isReplacing,
        findMatches,
        replacePreview,
        pendingChanges,
        getTotalMatches,
        buildPendingChanges,
        performReplace,
        resetReplaceState,
    };
}

function findMatchesInText(text: string, findReplace: any): Array<{ index: number; length: number; text: string }> {
    const searchPattern = findReplace.find;
    const foundMatches: Array<{ index: number; length: number; text: string }> = [];

    let regex: RegExp;
    try {
        if (findReplace.useRegex) {
            const flags = findReplace.caseSensitive ? 'g' : 'gi';
            regex = new RegExp(searchPattern, flags);
        } else {
            const escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const flags = findReplace.caseSensitive ? 'g' : 'gi';
            regex = new RegExp(escapedPattern, flags);
        }
    } catch (error) {
        return foundMatches;
    }

    let match;
    while ((match = regex.exec(text)) !== null) {
        foundMatches.push({
            index: match.index,
            length: match[0].length,
            text: match[0],
        });

        if (!regex.global) break;
    }

    return foundMatches;
}

function replaceInText(text: string, findReplace: any): string {
    const searchPattern = findReplace.find;

    try {
        if (findReplace.useRegex) {
            const flags = findReplace.caseSensitive ? 'g' : 'gi';
            const regex = new RegExp(searchPattern, flags);
            return text.replace(regex, findReplace.replace);
        } else {
            const flags = findReplace.caseSensitive ? 'g' : 'gi';
            const replaceRegex = new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            return text.replace(replaceRegex, findReplace.replace);
        }
    } catch (error) {
        return text;
    }
}
