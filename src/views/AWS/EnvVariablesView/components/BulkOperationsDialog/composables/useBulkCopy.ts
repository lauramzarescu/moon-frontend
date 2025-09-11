import { computed, reactive, ref, type Ref } from 'vue';
import { useToast } from '@/components/ui/toast';
import { AwsService } from '@/services/aws.service';
import { BulkOperationType } from '@/types/aws';
import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface';
import type { VariableData } from './useBulkVariables';

export function useBulkCopy(
    service: Ref<ServiceInterface | null>,
    availableServices: Ref<ServiceInterface[]>,
    getVariableData: Ref<Map<string, VariableData>>,
) {
    const { toast } = useToast();
    const awsService = new AwsService();

    const isCopying = ref(false);

    const copyDestination = reactive({
        service: '',
        container: '',
        operation: BulkOperationType.COPY,
    });

    const copySelectedOnly = ref(true);

    const destinationContainers = computed(() => {
        const selectedService = availableServices.value.find((s) => s.name === copyDestination.service);
        return selectedService?.containers.map((c) => c.name) || [];
    });

    const canPerformCopy = computed(() => {
        return copyDestination.service && copyDestination.container && getVariableData.value.size > 0;
    });

    const performCopyOperation = async () => {
        if (!service.value || !canPerformCopy.value) {
            toast({
                variant: 'destructive',
                title: 'Invalid Configuration',
                description: 'Please select a destination service and container.',
            });
            return;
        }

        isCopying.value = true;
        try {
            const variables = Array.from(getVariableData.value.values());

            // Group variables by their source container
            const byContainer = new Map<string, string[]>();
            variables.forEach((v) => {
                if (!byContainer.has(v.container)) byContainer.set(v.container, []);
                byContainer.get(v.container)!.push(v.name);
            });

            // Perform copy/move per source container
            for (const [sourceContainerName, envVarNames] of byContainer.entries()) {
                if (envVarNames.length === 0) continue;

                const payloadBase = {
                    sourceClusterName: service.value.clusterName,
                    sourceServiceName: service.value.name,
                    sourceContainerName,
                    targetClusterName: service.value.clusterName,
                    targetServiceName: copyDestination.service,
                    targetContainerName: copyDestination.container,
                };

                if (copyDestination.operation === BulkOperationType.MOVE) {
                    await awsService.moveEnvironmentVariables({
                        ...payloadBase,
                        variableNames: envVarNames,
                    });
                } else {
                    await awsService.copyEnvironmentVariables({
                        ...payloadBase,
                        variableNames: envVarNames,
                    });
                }
            }

            const operationText = copyDestination.operation === BulkOperationType.MOVE ? 'moved' : 'copied';

            toast({
                title: 'Success',
                description: `Successfully ${operationText} ${variables.length} variables to ${copyDestination.service}/${copyDestination.container}`,
                variant: 'success',
            });

            return true;
        } catch (error: any) {
            console.error('Copy operation failed:', error);
            toast({
                variant: 'destructive',
                title: 'Copy Failed',
                description: error.message || 'Failed to copy variables',
            });
            return false;
        } finally {
            isCopying.value = false;
        }
    };

    const resetCopyState = () => {
        copyDestination.service = '';
        copyDestination.container = '';
        copyDestination.operation = BulkOperationType.COPY;
        copySelectedOnly.value = true;
    };

    return {
        copyDestination,
        copySelectedOnly,
        destinationContainers,
        canPerformCopy,
        isCopying,
        performCopyOperation,
        resetCopyState,
    };
}
