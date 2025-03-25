import type { DeploymentRolloutState, TaskDefinitionStatus } from 'aws-sdk/clients/ecs'

export interface ServiceInterface {
  name: string
  clusterName: string
  desiredCount: number
  runningCount: number
  pendingCount: number
  status: 'ACTIVE' | 'INACTIVE' | 'DRAINING'
  taskDefinition: TaskDefinitionInterface
  containers: ContainerInterface[]
  deployments: DeploymentInterface[]
  deploymentStatus?: {
    isStuck: boolean;
    stuckSince?: Date;
    elapsedTimeMs?: number;
    currentImages: { containerName: string, image: string }[];
    targetImages: { containerName: string, image: string }[];
  };
}

export interface TaskDefinitionInterface {
  family: string
  revision: number
  arn: string
  name: string
  registeredAt: string
  status: TaskDefinitionStatus
  cpu: string
  memory: string
}

export interface ContainerInterface {
  image: string
  cpu: number
  memory: string
  name: string
  environmentVariables: {
    environment: Array<{ name: string; value: string }>
    environmentFiles: any[]
    secrets: any[]
  }
}

export interface DeploymentInterface {
  status: string
  desiredCount: number
  pendingCount: number
  runningCount: number
  createdAt: string
  updatedAt: string
  failedTasks: number
  rolloutState: DeploymentRolloutState
  rolloutStateReason: string
}

export interface InstanceInterface {
  id: string
  type: string
  state: string
  publicIp: string
  privateIp: string
  services?: ServiceInterface[]
}
