import { z } from 'zod';

// Define the enum for EC2 instance states
export enum InstanceStateName {
    PENDING = 'pending',
    RUNNING = 'running',
    STOPPING = 'stopping',
    STOPPED = 'stopped',
    SHUTTING_DOWN = 'shutting-down',
    TERMINATED = 'terminated',
}

// Define the schema for Inventory items
export const inventorySchema = z.object({
    id: z.string(),
    type: z.string(),
    state: z.nativeEnum(InstanceStateName),
    name: z.string(),
    publicIp: z.string(),
    primaryPrivateIp: z.string(),
    privateIpAddresses: z.array(z.string()),
    services: z.array(z.any()).optional(),
});

export type Instance = z.infer<typeof inventorySchema>;
