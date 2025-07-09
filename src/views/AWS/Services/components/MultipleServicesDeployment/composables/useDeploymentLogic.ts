import { reactive, ref } from 'vue';
import type { ServiceDeploymentData, TransformedService } from '../types';
import { AwsService } from '@/services/aws.service.ts';
import { serviceUpdateImageSchema } from '../schema';
import { useToast } from '@/components/ui/toast/use-toast';

export function useDeploymentLogic(initialServices: TransformedService[], maxServices: number) {
    const { toast } = useToast();
    const awsService = new AwsService();

    const selectedServices = ref<TransformedService[]>([]);
    const deploymentData = reactive(new Map<string, ServiceDeploymentData>());
    const isDeploying = ref(false);

    const getServiceKey = (service: TransformedService): string => {
        return `${service.clusterName}-${service.serviceName}`;
    };

    const handleServiceToggle = (service: TransformedService) => {
        const isCurrentlySelected = selectedServices.value.some(
            (s) => s.clusterName === service.clusterName && s.serviceName === service.serviceName,
        );

        if (isCurrentlySelected) {
            // Remove service
            selectedServices.value = selectedServices.value.filter(
                (s) => !(s.clusterName === service.clusterName && s.serviceName === service.serviceName),
            );
            // Remove deployment data
            const key = getServiceKey(service);
            deploymentData.delete(key);
        } else {
            // Add service (if under limit)
            if (selectedServices.value.length < maxServices) {
                selectedServices.value.push(service);
                // Initialize deployment data
                const key = getServiceKey(service);
                deploymentData.set(key, {
                    service,
                    newImageUri: service.image,
                    validationError: '',
                });
            }
        }
    };

    const handleImageUpdate = (service: TransformedService, imageUri: string) => {
        const key = getServiceKey(service);
        const data = deploymentData.get(key);

        if (data) {
            data.newImageUri = imageUri;

            // Validate the new image URI
            try {
                serviceUpdateImageSchema.parse({
                    clusterName: service.clusterName,
                    serviceName: service.serviceName,
                    containerName: service.containerName,
                    newImageUri: imageUri,
                });
                data.validationError = '';
            } catch (error: any) {
                if (error.errors && error.errors.length > 0) {
                    data.validationError = error.errors[0].message;
                } else {
                    data.validationError = 'Invalid input';
                }
            }
        }
    };

    const handleServiceRemove = (service: TransformedService) => {
        handleServiceToggle(service);
    };

    const handleDeploy = async (): Promise<boolean> => {
        if (selectedServices.value.length === 0) {
            console.log('No services selected for deployment');
            return false;
        }

        console.log(`Starting sequential deployment for ${selectedServices.value.length} services`);
        isDeploying.value = true;

        let successCount = 0;
        let failureCount = 0;
        const failedServices: string[] = [];

        try {
            for (let i = 0; i < selectedServices.value.length; i++) {
                const service = selectedServices.value[i];
                const key = getServiceKey(service);
                const data = deploymentData.get(key);

                console.log(`Deploying service ${i + 1}/${selectedServices.value.length}: ${service.serviceName}`);

                if (!data) {
                    console.error(`No deployment data found for service: ${service.serviceName}`);
                    failureCount++;
                    failedServices.push(`${service.clusterName}/${service.serviceName}`);
                    continue;
                }

                if (!data.newImageUri) {
                    console.error(`No image URI provided for service: ${service.serviceName}`);
                    failureCount++;
                    failedServices.push(`${service.clusterName}/${service.serviceName}`);
                    continue;
                }

                if (data.validationError) {
                    console.error(`Validation error for service ${service.serviceName}: ${data.validationError}`);
                    failureCount++;
                    failedServices.push(`${service.clusterName}/${service.serviceName}`);
                    continue;
                }

                try {
                    const deploymentPayload = {
                        clusterName: service.clusterName,
                        serviceName: service.serviceName,
                        containerName: service.containerName,
                        newImageUri: data.newImageUri,
                    };

                    console.log(`Deploying ${service.serviceName} with payload:`, deploymentPayload);

                    const result = await awsService.updateServiceImage(deploymentPayload);

                    console.log(`✅ Successfully deployed ${service.serviceName}:`, result);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Failed to deploy ${service.serviceName}:`, error);
                    failureCount++;
                    failedServices.push(`${service.clusterName}/${service.serviceName}`);
                }
            }

            // Show results
            console.log(`Deployment completed: ${successCount} successful, ${failureCount} failed`);

            if (failureCount === 0) {
                toast({
                    title: 'Deployment Successful',
                    description: `Successfully deployed ${successCount} service${successCount !== 1 ? 's' : ''}`,
                    variant: 'success',
                });
                return true;
            } else if (successCount > 0) {
                toast({
                    title: 'Partial Deployment Success',
                    description: `${successCount} service${successCount !== 1 ? 's' : ''} deployed successfully. ${failureCount} failed: ${failedServices.join(', ')}`,
                    variant: 'destructive',
                });
                return true;
            } else {
                toast({
                    title: 'Deployment Failed',
                    description: `All deployments failed: ${failedServices.join(', ')}`,
                    variant: 'destructive',
                });
                return false;
            }
        } catch (error) {
            console.error('Unexpected deployment error:', error);
            toast({
                title: 'Deployment Error',
                description: 'An unexpected error occurred during deployment',
                variant: 'destructive',
            });
            return false;
        } finally {
            isDeploying.value = false;
            console.log('Deployment process completed');
        }
    };

    const resetState = () => {
        selectedServices.value = [];
        deploymentData.clear();
        isDeploying.value = false;
    };

    const cleanupInvalidServices = (availableServices: TransformedService[]) => {
        const availableServiceKeys = new Set(availableServices.map((s) => getServiceKey(s)));

        // Remove selected services that are no longer available
        selectedServices.value = selectedServices.value.filter((service) => {
            const key = getServiceKey(service);
            const isStillAvailable = availableServiceKeys.has(key);

            if (!isStillAvailable) {
                // Remove deployment data for unavailable services
                deploymentData.delete(key);
                console.log(`Removed unavailable service: ${service.serviceName}`);
            }

            return isStillAvailable;
        });

        // Update service references in deployment data to use latest service info
        for (const [key, data] of deploymentData.entries()) {
            const updatedService = availableServices.find((s) => getServiceKey(s) === key);
            if (updatedService) {
                // Update the service reference but preserve the configuration
                data.service = updatedService;
            }
        }
    };

    return {
        selectedServices,
        deploymentData,
        isDeploying,
        handleServiceToggle,
        handleImageUpdate,
        handleServiceRemove,
        handleDeploy,
        resetState,
        cleanupInvalidServices,
    };
}
