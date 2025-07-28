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
            <p v-if="requires2FAVerification" class="text-xs text-blue-600 dark:text-blue-400 mt-2">
                🔒 Changes to this setting require 2FA verification for security.
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

    <!-- 2FA Verification Modal -->
    <TwoFactorVerificationModal
        ref="verificationModalRef"
        v-model:open="show2FAVerificationModal"
        title="Verify Organization Settings Change"
        description="For security reasons, please verify your identity to change MFA enforcement settings."
        :two-factor-method="twoFactorMethod"
        input-prefix="org-settings-2fa"
        @verify="handle2FAVerification"
        @cancel="handle2FACancel"
    />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-vue-next';
import { OrganizationService } from '@/services/organization.service.ts';
import { UserService } from '@/services/user.service.ts';
import { TwoFactorMethod } from '@/enums/user/user.enum.ts';
import TwoFactorVerificationModal from '@/components/ui/two-factor-verification-modal/TwoFactorVerificationModal.vue';
import type { OrganizationDetailsResponse, OrganizationInput, UpdateOrganizationInput } from './schema.ts';
import { organizationPageConfig } from './schema.ts';
import { toast } from '@/components/ui/toast';

const organizationService = new OrganizationService();
const userService = new UserService();
const organizationDetails = ref<OrganizationDetailsResponse | null>(null);
const pageConfig = organizationPageConfig;
const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// 2FA verification state
const show2FAVerificationModal = ref(false);
const twoFactorMethod = ref<TwoFactorMethod | null>(null);
const twoFactorEnabled = ref(false);
const twoFactorVerified = ref(false);
const pendingEnforce2FAValue = ref<boolean | null>(null);
const verificationModalRef = ref<InstanceType<typeof TwoFactorVerificationModal> | null>(null);

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

const requires2FAVerification = computed(() => {
    return twoFactorEnabled.value && twoFactorVerified.value;
});

// Methods
const loadOrganizationData = async () => {
    try {
        isLoading.value = true;
        errorMessage.value = '';

        const [orgResponse, twoFactorStatus] = await Promise.all([organizationService.getDetails(), userService.get2FAStatus()]);

        organizationDetails.value = orgResponse;

        twoFactorMethod.value = twoFactorStatus.method ?? null;
        twoFactorEnabled.value = twoFactorStatus.enabled;
        twoFactorVerified.value = twoFactorStatus.verified;

        formData.name = orgResponse.name;
        formData.enforce2FA = orgResponse.enforce2FA;

        originalData.value = {
            name: orgResponse.name,
            enforce2FA: orgResponse.enforce2FA,
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

    if (requires2FAVerification.value) {
        pendingEnforce2FAValue.value = value;
        show2FAVerificationModal.value = true;
    } else {
        await updateEnforce2FA(value);
    }
};

const updateEnforce2FA = async (value: boolean) => {
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

        formData.enforce2FA = response.enforce2FA;
        originalData.value.enforce2FA = response.enforce2FA;

        toast({
            title: 'Success',
            description: 'Organization settings updated successfully.',
            variant: 'success',
        });

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

        formData.enforce2FA = originalData.value.enforce2FA;
    } finally {
        isLoading.value = false;
    }
};

const handle2FAVerification = async (code: string) => {
    if (!verificationModalRef.value || pendingEnforce2FAValue.value === null) return;

    verificationModalRef.value.setLoading(true);
    verificationModalRef.value.clearError();

    try {
        await userService.verify2FACode(code);

        await updateEnforce2FA(pendingEnforce2FAValue.value);

        show2FAVerificationModal.value = false;
        pendingEnforce2FAValue.value = null;
    } catch (error: any) {
        verificationModalRef.value.setError('The verification code you entered is incorrect. Please try again.');
        formData.enforce2FA = originalData.value.enforce2FA;
    } finally {
        verificationModalRef.value.setLoading(false);
    }
};

const handle2FACancel = () => {
    show2FAVerificationModal.value = false;
    pendingEnforce2FAValue.value = null;
    // Revert the toggle state
    formData.enforce2FA = originalData.value.enforce2FA;
};

onMounted(() => {
    loadOrganizationData();
});
</script>
