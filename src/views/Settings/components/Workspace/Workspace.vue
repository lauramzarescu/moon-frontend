<script setup lang="ts">
import FormsLayout from '@/views/Settings/layout/FormsLayout.vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-vue-next';
import { Switch } from '@/components/ui/switch';
import { computed, onMounted, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ServicesConfigService } from '@/services/services-config.service.ts';
import { type ServicesConfigInput, ServiceType } from '@/views/Settings/components/Workspace/schema.ts';
import { usePermissions } from '@/composables/usePermissions.ts';
import { PermissionEnum } from '@/enums/user/user.enum.ts';

export interface AWSConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    accountId: string;
}

interface CloudService {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    isConfigured: boolean;
    credentials: AWSConfig | Record<string, string>;
}

const awsForm = ref<AWSConfig>({
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
    accountId: '',
});

const awsFormLabels: Record<keyof AWSConfig, string> = {
    accessKeyId: 'Access Key ID',
    secretAccessKey: 'Secret Access Key',
    region: 'Region',
    accountId: 'Account ID',
};

const { hasPermission } = usePermissions();

const servicesConfigService = new ServicesConfigService();

const isAwsConfigured = computed(() => {
    return Boolean(awsForm.value.accessKeyId && awsForm.value.accountId && awsForm.value.region && awsForm.value.secretAccessKey);
});

const services = ref<CloudService[]>([
    {
        id: 'aws',
        name: 'Amazon Web Services',
        description: 'Configure AWS credentials to manage your cloud infrastructure',
        isEnabled: isAwsConfigured.value,
        isConfigured: isAwsConfigured.value,
        credentials: {},
    },
    {
        id: 'digitalocean',
        name: 'Digital Ocean',
        description: 'Set up Digital Ocean access for container and database management',
        isEnabled: false,
        isConfigured: false,
        credentials: {},
    },
    {
        id: 'gcloud',
        name: 'Google Cloud',
        description: 'Connect your Google Cloud Platform services',
        isEnabled: false,
        isConfigured: false,
        credentials: {},
    },
]);

onMounted(async () => {
    await loadConfigurations();
});

const loadConfigurations = async () => {
    const configs = await fetchConfigurations();

    services.value = services.value.map((service) => ({
        ...service,
        isConfigured: !!configs[service.id as keyof typeof configs],
        isEnabled: !!configs[service.id as keyof typeof configs],
        credentials: configs[service.id as keyof typeof configs] || {},
    }));
};

const fetchConfigurations = async () => {
    return await servicesConfigService.get<ServicesConfigInput>(servicesConfigService.resource);
};

const configureService = async (serviceId: string) => {
    const service = services.value.find((s) => s.id === serviceId);
    if (service) {
        service.isEnabled = true;
    }
};

const saveAwsConfiguration = async (serviceId: string) => {
    const service = services.value.find((s) => s.id === serviceId);
    if (service && service.id === 'aws') {
        service.credentials = { ...awsForm.value };
        service.isConfigured = true;
    }
};

const formatKeyName = (key: string) => {
    return key
        .split(/(?=[A-Z])/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const getAwsFormLabel = (key: keyof AWSConfig): string | null => {
    return awsFormLabels[key] || null;
};
</script>

<template>
    <FormsLayout>
        <template #header>
            <div class="mb-8">
                <h1 class="text-2xl font-bold dark:text-white">Cloud Services</h1>
                <p class="text-gray-600 dark:text-gray-300 mt-2">Configure your cloud service providers to manage your infrastructure</p>
            </div>
        </template>

        <div class="space-y-6">
            <div v-for="service in services" :key="service.id" class="mb-8 p-4 border rounded-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold">{{ service.name }}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ service.description }}
                        </p>
                    </div>
                    <Switch v-model:checked="service.isEnabled" :disabled="!hasPermission(PermissionEnum.SAML_CONFIGURATION_CREATE)" />
                </div>

                <Alert :variant="service.isConfigured ? 'success' : 'warning'" class="mt-4" v-if="service.isEnabled">
                    <AlertCircle class="h-4 w-4" />
                    <AlertTitle>
                        {{ service.isConfigured ? 'Service Active' : 'Service Not Configured' }}
                    </AlertTitle>
                    <AlertDescription>
                        {{
                            service.isConfigured
                                ? 'The service is up and running'
                                : `Please configure your ${service.name} credentials to start using the service.`
                        }}
                    </AlertDescription>
                </Alert>

                <div v-if="service.isEnabled" class="mt-4">
                    <div v-if="!service.isConfigured && service.id === ServiceType.aws" class="flex flex-col p-8 border rounded-lg">
                        <h3 class="text-lg font-semibold mb-4">Configure AWS Credentials</h3>
                        <Form @submit.prevent="saveAwsConfiguration(service.id)">
                            <div class="space-y-4">
                                <template v-for="(value, key) in awsForm" :key="key">
                                    <FormField :key="key" :name="key" class="mt-4" v-if="getAwsFormLabel(key as keyof AWSConfig)">
                                        <FormItem>
                                            <FormLabel>{{ getAwsFormLabel(key as keyof AWSConfig) }}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    v-model="awsForm[key as keyof AWSConfig]"
                                                    :type="key === 'secretAccessKey' ? 'password' : 'text'"
                                                    :placeholder="`Enter ${getAwsFormLabel(key as keyof AWSConfig)}`"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    </FormField>
                                </template>

                                <Button type="submit" class="w-full">Save AWS Configuration</Button>
                            </div>
                        </Form>
                    </div>

                    <div
                        v-if="!service.isConfigured && service.id !== ServiceType.aws"
                        class="flex flex-col items-center justify-center p-8 border rounded-lg"
                    >
                        <h3 class="text-lg font-semibold mb-2">No Configuration Found</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Start configuring {{ service.name }} for your organization
                        </p>
                        <Button @click="configureService(service.id)"> Configure {{ service.name }}</Button>
                    </div>

                    <div v-if="service.isConfigured && service.id === ServiceType.aws" class="p-4 border rounded-lg mt-4">
                        <h3 class="text-lg font-semibold mb-4">AWS Configuration</h3>
                        <div class="space-y-2">
                            <template v-for="(value, key) in service.credentials">
                                <div v-if="getAwsFormLabel(key as keyof AWSConfig)" :key="key" class="flex justify-between items-center">
                                    <span class="font-medium">{{ getAwsFormLabel(key as keyof AWSConfig) }}</span>
                                    <span class="text-gray-600">
                                        {{ key.includes('secret') ? '••••••••' : value }}
                                    </span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </FormsLayout>
</template>

<style scoped>
.dark {
    color-scheme: dark;
}
</style>
