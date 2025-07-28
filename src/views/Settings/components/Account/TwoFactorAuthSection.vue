<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue';
import { Switch } from '@/components/ui/switch';
import { UserService } from '@/services/user.service.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import TwoFactorSetupModal from './TwoFactorSetupModal.vue';
import TwoFactorVerificationModal from '@/components/ui/two-factor-verification-modal/TwoFactorVerificationModal.vue';
import TwoFactorMethodSelection from './TwoFactorMethodSelection.vue';
import YubikeyManagement from './YubikeyManagement.vue';
import { LoginType, TwoFactorMethod } from '@/enums/user/user.enum.ts';
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
    twoFactorMethod: {
        type: String as PropType<TwoFactorMethod | null>,
        default: null,
    },
    yubikeyCount: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['update:two-factor-enabled', 'update:two-factor-verified', 'status-updated']);

// Initialize services and stores
const userService = new UserService();
const authStore = useAuthStore();

const isSamlUser = computed(() => authStore.user?.loginType === LoginType.saml);

const show2FAModal = ref(false);
const showDisable2FAModal = ref(false);
const qrCodeUrl = ref('');
const isLoading = ref(false);
const is2FASetupComplete = ref(false);
const verificationModalRef = ref<InstanceType<typeof TwoFactorVerificationModal> | null>(null);

watch(
    () => [props.twoFactorEnabled, props.twoFactorVerified],
    ([enabled, verified]) => {
        is2FASetupComplete.value = enabled && verified;
    },
);

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

const onMethodUpdated = (method: TwoFactorMethod) => {
    emit('status-updated');
};

const onYubikeysUpdated = async (count: number) => {
    console.log('TwoFactorAuthSection: Received yubikeys-updated with count:', count);
    console.log('TwoFactorAuthSection: Emitting status-updated');
    emit('status-updated');
};


</script>

<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div>
                <h4 class="text-sm font-medium">Two-Factor Authentication</h4>
                <p class="text-sm text-foreground">Add an extra layer of security to your account</p>
            </div>
            <div class="flex items-center space-x-2">
                <Switch
                    :checked="twoFactorEnabled && twoFactorVerified"
                    @update:checked="handleToggle"
                    :disabled="isLoading || isSamlUser"
                />
            </div>
        </div>
        <p v-if="twoFactorEnabled && twoFactorVerified" class="text-sm text-green-600 dark:text-green-400">
            Two-factor authentication is enabled for your account.
        </p>
    </div>

    <!-- 2FA Method Selection (only show when 2FA is enabled) -->
    <div v-if="twoFactorEnabled && twoFactorVerified">
        <TwoFactorMethodSelection
            :key="`method-selection-${props.yubikeyCount}`"
            :current-method="twoFactorMethod"
            :totp-enabled="twoFactorEnabled && twoFactorVerified"
            :yubikey-count="props.yubikeyCount"
            @method-updated="onMethodUpdated"
        />
    </div>

    <!-- YubiKey Management (only show when 2FA is enabled) -->
    <div v-if="twoFactorEnabled && twoFactorVerified">
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
        :two-factor-method="twoFactorMethod"
        input-prefix="disable-2fa"
        @verify="handle2FADisableVerification"
        @cancel="handle2FADisableCancel"
    />
</template>
