<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UserService } from '@/services/user.service.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import TwoFactorSetupModal from './TwoFactorSetupModal.vue';
import TwoFactorVerificationModal from '@/components/ui/two-factor-verification-modal/TwoFactorVerificationModal.vue';
import TwoFactorMethodSelection from './TwoFactorMethodSelection.vue';
import YubikeyManagement from './YubikeyManagement.vue';
import { LoginType } from '@/enums/user/user.enum.ts';
import { toast } from '@/components/ui/toast';
import { twoFactorSetupResponseSchema } from '@/views/Settings/components/Account/schema.ts';

const props = defineProps({
    twoFactorEnabled: {
        type: Boolean,
        required: true,
    },
    twoFactorVerified: {
        type: Boolean,
        required: true,
    },
});

const emit = defineEmits(['update:two-factor-enabled', 'update:two-factor-verified', 'status-updated']);

const userService = new UserService();
const authStore = useAuthStore();
const isSamlUser = computed(() => authStore.user?.loginType === LoginType.saml);

const securityLevel = ref<'HIGH' | 'MEDIUM' | 'LOW' | null>(null);
const enforcedMethod = ref<'HIGH_SECURITY_ONLY' | 'WEBAUTHN_ONLY' | null>(null);

const securityLevelText = computed(() => {
    switch (securityLevel.value) {
        case 'HIGH':
            return 'High Security';
        case 'MEDIUM':
            return 'Medium Security';
        case 'LOW':
            return 'Lower Security';
        default:
            return '';
    }
});

const securityLevelColor = computed(() => {
    switch (securityLevel.value) {
        case 'HIGH':
            return 'text-green-600 dark:text-green-400';
        case 'MEDIUM':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'LOW':
            return 'text-orange-600 dark:text-orange-400';
        default:
            return '';
    }
});

const isWebAuthnOnlyEnforced = computed(() => enforcedMethod.value === 'WEBAUTHN_ONLY');

const show2FAModal = ref(false);
const showDisable2FAModal = ref(false);
const qrCodeUrl = ref('');
const isLoading = ref(false);
const is2FASetupComplete = ref(false);
const verificationModalRef = ref<InstanceType<typeof TwoFactorVerificationModal> | null>(null);
const methodSelectionRef = ref<InstanceType<typeof TwoFactorMethodSelection> | null>(null);

watch(
    () => [props.twoFactorEnabled, props.twoFactorVerified],
    ([enabled, verified]) => {
        is2FASetupComplete.value = enabled && verified;
        if (enabled && verified) {
            fetch2FAStatus();
        }
    },
);

const fetch2FAStatus = async () => {
    try {
        const twoFactorStatus = await userService.get2FAStatus();
        securityLevel.value = twoFactorStatus.securityLevel ?? null;
        enforcedMethod.value = twoFactorStatus.enforcedMethod ?? null;
    } catch (error) {
        console.error('Failed to fetch 2FA status:', error);
        securityLevel.value = null;
        enforcedMethod.value = null;
    }
};

onMounted(() => {
    if (props.twoFactorEnabled && props.twoFactorVerified) {
        fetch2FAStatus();
    }
});

const generate2FAQR = async () => {
    isLoading.value = true;
    try {
        const response = await userService.setup2FA();

        const validatedResponse = twoFactorSetupResponseSchema.parse(response);
        qrCodeUrl.value = validatedResponse.qrCode;

        show2FAModal.value = true;
    } catch (error) {
        toast({
            title: 'Error generating 2FA QR code',
            description: 'There was an error setting up two-factor authentication. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};

const handleToggle = (value: boolean) => {
    if (!value && props.twoFactorEnabled && props.twoFactorVerified) {
        showDisable2FAModal.value = true;
    } else if (value) {
        generate2FAQR();
    }
};

const onSetupComplete = async (enabled: boolean, verified: boolean) => {
    emit('update:two-factor-enabled', enabled);
    emit('update:two-factor-verified', verified);
    show2FAModal.value = false;

    emit('status-updated');
};

const handle2FADisableVerification = async (code: string) => {
    if (!verificationModalRef.value) return;

    verificationModalRef.value.setLoading(true);
    verificationModalRef.value.clearError();

    try {
        await userService.disable2FA(code);

        toast({
            title: 'Two-factor authentication disabled',
            description: 'Two-factor authentication has been disabled for your account.',
            variant: 'success',
        });

        emit('update:two-factor-enabled', false);
        emit('update:two-factor-verified', false);
        showDisable2FAModal.value = false;

        emit('status-updated');
    } catch (error: any) {
        verificationModalRef.value.setError('The verification code you entered is incorrect. Please try again.');
    } finally {
        verificationModalRef.value.setLoading(false);
    }
};

const handle2FADisableCancel = () => {
    showDisable2FAModal.value = false;
};

const onMethodUpdated = () => {
    emit('status-updated');
};

const onYubikeysUpdated = async (count: number) => {
    if (methodSelectionRef.value) {
        methodSelectionRef.value.refresh2FAStatus();
    }

    emit('status-updated');
};
</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div>
                <div class="flex items-center gap-2">
                    <h4 class="text-sm font-medium">Two-Factor Authentication</h4>
                    <Badge
                        v-if="securityLevel && props.twoFactorEnabled && props.twoFactorVerified"
                        :variant="securityLevel === 'HIGH' ? 'default' : securityLevel === 'MEDIUM' ? 'secondary' : 'outline'"
                        :class="securityLevelColor"
                    >
                        {{ securityLevelText }}
                    </Badge>
                </div>
                <p class="text-sm text-foreground">Add an extra layer of security to your account</p>
                <p v-if="enforcedMethod === 'HIGH_SECURITY_ONLY'" class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    🔒 High-security methods enforced - OTP methods disabled for enhanced security
                </p>
                <p v-else-if="enforcedMethod === 'WEBAUTHN_ONLY'" class="text-xs text-green-600 dark:text-green-400 mt-1">
                    🔐 WebAuthn-only mode - Maximum security enabled
                </p>
            </div>
            <div class="flex items-center space-x-2">
                <Switch
                    :checked="props.twoFactorEnabled && props.twoFactorVerified"
                    @update:checked="handleToggle"
                    :disabled="isLoading || isSamlUser"
                />
            </div>
        </div>
        <p v-if="props.twoFactorEnabled && props.twoFactorVerified" class="text-sm text-green-600 dark:text-green-400">
            Two-factor authentication is enabled for your account.
        </p>
    </div>

    <!-- 2FA Method Selection (only show when 2FA is enabled) -->
    <div v-if="props.twoFactorEnabled && props.twoFactorVerified">
        <TwoFactorMethodSelection ref="methodSelectionRef" @method-updated="onMethodUpdated" />
    </div>

    <!-- YubiKey Management (only show when 2FA is enabled) -->
    <div v-if="props.twoFactorEnabled && props.twoFactorVerified">
        <YubikeyManagement @yubikeys-updated="onYubikeysUpdated" />
    </div>

    <!-- 2FA Setup Modal -->
    <TwoFactorSetupModal v-model:open="show2FAModal" :qr-code-url="qrCodeUrl" :is-loading="isLoading" @setup-complete="onSetupComplete" />

    <!-- 2FA Disable Verification Modal -->
    <TwoFactorVerificationModal
        ref="verificationModalRef"
        v-model:open="showDisable2FAModal"
        title="Disable Two-Factor Authentication"
        description="For security reasons, please verify your identity to disable 2FA."
        input-prefix="disable-2fa"
        @verify="handle2FADisableVerification"
        @cancel="handle2FADisableCancel"
    />
</template>
