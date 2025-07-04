<template>
    <div class="space-y-8">
        <!-- Header Section -->
        <div>
            <h3 class="pt-5 text-lg font-medium">{{ pageConfig.title }}</h3>
            <p class="text-sm text-foreground">{{ pageConfig.description }}</p>
        </div>

        <!-- Organization Name Section -->
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="text-sm font-medium">{{ pageConfig.fields.name.label }}</h4>
                    <p class="text-sm text-foreground">{{ pageConfig.fields.name.description }}</p>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formData.name || 'Loading...' }}
                </div>
            </div>
        </div>

        <!-- Two-Factor Authentication Enforcement Section -->
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="text-sm font-medium">{{ pageConfig.fields.enforce2FA.label }}</h4>
                    <p class="text-sm text-foreground">{{ pageConfig.fields.enforce2FA.description }}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <Switch :checked="formData.enforce2FA" @update:checked="handleToggle" :disabled="isLoading" />
                </div>
            </div>
            <p v-if="formData.enforce2FA" class="text-sm text-green-600 dark:text-green-400">
                Two-factor authentication is enforced for all organization members.
            </p>
            <p v-else class="text-sm text-yellow-600 dark:text-yellow-400">
                Two-factor authentication is optional for organization members.
            </p>
        </div>

        <!-- Success/Error Messages -->
        <Alert v-if="successMessage" variant="success" class="mt-4">
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
                {{ successMessage }}
            </AlertDescription>
        </Alert>

        <Alert v-if="errorMessage" variant="destructive" class="mt-4">
            <AlertCircle class="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                {{ errorMessage }}
            </AlertDescription>
        </Alert>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-vue-next';
import { OrganizationService } from '@/services/organization.service.ts';
import type { OrganizationDetailsResponse, OrganizationInput, UpdateOrganizationInput } from './schema.ts';
import { organizationPageConfig } from './schema.ts';
import { toast } from '@/components/ui/toast';

const organizationService = new OrganizationService();
const organizationDetails = ref<OrganizationDetailsResponse | null>(null);
const pageConfig = organizationPageConfig;
const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const formData = reactive<OrganizationInput>({
    name: '',
    enforce2FA: false,
});

const originalData = ref<OrganizationInput>({
    name: '',
    enforce2FA: false,
});

const hasChanges = computed(() => {
    return formData.enforce2FA !== originalData.value.enforce2FA;
});

// Methods
const loadOrganizationData = async () => {
    try {
        isLoading.value = true;
        errorMessage.value = '';

        const response = await organizationService.getDetails();
        organizationDetails.value = response;

        formData.name = response.name;
        formData.enforce2FA = response.enforce2FA;

        // Store original data for comparison
        originalData.value = {
            name: response.name,
            enforce2FA: response.enforce2FA,
        };
    } catch (error) {
        console.error('Failed to load organization data:', error);
        errorMessage.value = 'Failed to load organization settings. Please try again.';
    } finally {
        isLoading.value = false;
    }
};

const handleToggle = async (value: boolean) => {
    if (isLoading.value) return;

    try {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';

        const updateData: UpdateOrganizationInput = {
            enforce2FA: value,
        };

        if (!organizationDetails.value?.id) {
            toast({
                title: 'Error',
                description: 'Failed to update organization settings. Please try again.',
                variant: 'destructive',
            });
            return;
        }

        const response = await organizationService.updateSettings(organizationDetails.value.id, updateData);

        // Update form data and original data
        formData.enforce2FA = response.enforce2FA;
        originalData.value.enforce2FA = response.enforce2FA;

        toast({
            title: 'Success',
            description: 'Organization settings updated successfully.',
            variant: 'success',
        });

        // Clear success message after 5 seconds
        setTimeout(() => {
            successMessage.value = '';
        }, 5000);
    } catch (error) {
        console.error('Failed to update organization settings:', error);

        toast({
            title: 'Error',
            description: 'Failed to update organization settings. Please try again.',
            variant: 'destructive',
        });

        // Revert the toggle state on error
        formData.enforce2FA = originalData.value.enforce2FA;
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    loadOrganizationData();
});
</script>
