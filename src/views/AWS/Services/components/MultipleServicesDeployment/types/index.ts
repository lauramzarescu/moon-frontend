export interface TransformedService {
    clusterName: string;
    serviceName: string;
    image: string;
    status: string;
    containerName: string;
}

export interface ServiceDeploymentData {
    service: TransformedService;
    newImageUri: string;
    validationError: string;
}

export interface DeploymentStep {
    id: number;
    title: string;
    description: string;
}

export interface DeploymentResult {
    success: boolean;
    successCount: number;
    failedDeployments: string[];
}
