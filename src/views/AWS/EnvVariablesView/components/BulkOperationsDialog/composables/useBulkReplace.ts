import { computed, reactive, ref, type Ref } from 'vue';
import { useToast } from '@/components/ui/toast';
import { AwsService } from '@/services/aws.service';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import type { VariableData } from './useBulkVariables';

export interface FindMatch {
    variableId: string;
    variableName: string;
    isSecret: boolean;
    container: string;
    originalValue: string;
    newValue: string;
    matches: Array<{
        index: number;
        length: number;
        text: string;
    }>;
}

export function useBulkReplace(service: Ref<ServiceInterface | null>, getVariableData: Ref<Map<string, VariableData>>) {
    const { toast } = useToast();
    const awsService = new AwsService();

    const findReplace = reactive({
        find: '',
        replace: '',
        caseSensitive: false,
        useRegex: false,
    });

    const isReplacing = ref(false);

    const findMatches = computed((): FindMatch[] => {
        if (!findReplace.find || getVariableData.value.size === 0) {
            return [];
        }

        const matches: FindMatch[] = [];
        const variableData = getVariableData.value;

        variableData.forEach((variable, variableId) => {
            const searchValue = variable.value;
            const searchPattern = findReplace.find;

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
                return;
            }

            const foundMatches: Array<{ index: number; length: number; text: string }> = [];
            let match;

            while ((match = regex.exec(searchValue)) !== null) {
                foundMatches.push({
                    index: match.index,
                    length: match[0].length,
                    text: match[0],
                });

                if (!regex.global) break;
            }

            if (foundMatches.length > 0) {
                let newValue = searchValue;

                if (findReplace.useRegex) {
                    newValue = searchValue.replace(regex, findReplace.replace);
                } else {
                    const flags = findReplace.caseSensitive ? 'g' : 'gi';
                    const replaceRegex = new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
                    newValue = searchValue.replace(replaceRegex, findReplace.replace);
                }

                matches.push({
                    variableId,
                    variableName: variable.name,
                    isSecret: variable.isSecret,
                    container: variable.container,
                    originalValue: searchValue,
                    newValue,
                    matches: foundMatches,
                });
            }
        });

        return matches;
    });

    const replacePreview = computed(() => {
        const matches = findMatches.value;

        if (matches.length === 0) {
            return findReplace.find ? 'No matches found' : 'Enter search text to preview changes';
        }

        return `Found ${matches.length} variable(s) with matches. ${getTotalMatches()} occurrence(s) will be replaced.`;
    });

    const getTotalMatches = (): number => {
        return findMatches.value.reduce((total, match) => total + match.matches.length, 0);
    };

    const performReplace = async () => {
        if (!service.value || findMatches.value.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Changes',
                description: 'No matches found to replace.',
            });
            return false;
        }

        isReplacing.value = true;

        try {
            const containerUpdates = new Map<
                string,
                {
                    environmentVariables: Array<{ name: string; value: string }>;
                    secrets: Array<{ name: string; valueFrom: string }>;
                }
            >();

            findMatches.value.forEach((match) => {
                if (!containerUpdates.has(match.container)) {
                    containerUpdates.set(match.container, {
                        environmentVariables: [],
                        secrets: [],
                    });
                }

                const containerUpdate = containerUpdates.get(match.container)!;

                if (match.isSecret) {
                    containerUpdate.secrets.push({
                        name: match.variableName,
                        valueFrom: match.newValue,
                    });
                } else {
                    containerUpdate.environmentVariables.push({
                        name: match.variableName,
                        value: match.newValue,
                    });
                }
            });

            const updatePromises = Array.from(containerUpdates.entries()).map(([containerName, updates]) =>
                awsService.editEnvironmentVariables({
                    clusterName: service.value!.clusterName,
                    serviceName: service.value!.name,
                    containerName,
                    environmentVariables: updates.environmentVariables,
                    secrets: updates.secrets,
                }),
            );

            await Promise.all(updatePromises);

            toast({
                title: 'Replace Successful',
                description: `Successfully replaced ${getTotalMatches()} occurrence(s) in ${findMatches.value.length} variable(s)`,
                variant: 'success',
            });

            return true;
        } catch (error: any) {
            console.error('Replace operation failed:', error);
            toast({
                variant: 'destructive',
                title: 'Replace Failed',
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
    };

    return {
        findReplace,
        isReplacing,
        findMatches,
        replacePreview,
        getTotalMatches,
        performReplace,
        resetReplaceState,
    };
}
