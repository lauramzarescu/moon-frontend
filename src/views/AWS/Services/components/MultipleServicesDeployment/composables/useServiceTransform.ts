import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import type { TransformedService } from '../types';

export function useServiceTransform() {
    const transformServices = (services: ServiceInterface[]): TransformedService[] => {
        return services.map((service) => ({
            clusterName: service.clusterName,
            serviceName: service.name,
            image: service.containers[0]?.image || 'No image',
            status: service.status,
            containerName: service.containers[0]?.name || 'No container',
            isClusterProduction: service.isClusterProduction,
        }));
    };

    const getServiceKey = (service: TransformedService): string => {
        return `${service.clusterName}-${service.serviceName}`;
    };

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'running':
                return 'default';
            case 'inactive':
            case 'stopped':
                return 'secondary';
            case 'pending':
                return 'outline';
            default:
                return 'destructive';
        }
    };

    return {
        transformServices,
        getServiceKey,
        getStatusVariant,
    };
}
