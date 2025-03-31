import type { ServiceInterface } from '@/views/AWS/Services/types/service.interface.ts';
import type { ScheduledTaskInterface } from '@/views/AWS/ScheduledTasks/types/scheduled-task.interface.ts';

export interface ClusterInterface {
    name: string;
    arn: string;
    status: 'ACTIVE' | 'INACTIVE' | 'FAILED' | 'PROVISIONING' | 'DEPROVISIONING';
    runningTasks: number;
    pendingTasks: number;
    registeredContainerInstances: number;
    servicesCount: number;
    services: ServiceInterface[];
    scheduledTasks: ScheduledTaskInterface[];
}
