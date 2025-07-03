<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Switch } from '@/components/ui/switch';
import { UserService } from '@/services/user.service.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import TwoFactorSetupModal from './TwoFactorSetupModal.vue';
import TwoFactorDisableModal from './TwoFactorDisableModal.vue';
import { LoginType } from '@/enums/user/user.enum.ts';
import { generate2FAQR } from '@/utils/twoFactorUtils.ts';

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

const emit = defineEmits(['update:two-factor-enabled', 'update:two-factor-verified']);

// Initialize services and stores
const userService = new UserService();
const authStore = useAuthStore();

const isSamlUser = computed(() => authStore.user?.loginType === LoginType.saml);

const show2FAModal = ref(false);
const showDisable2FAModal = ref(false);
const qrCodeUrl = ref('');
const isLoading = ref(false);
const is2FASetupComplete = ref(false);

// Watch for changes in props to update local state
watch(
    () => [props.twoFactorEnabled, props.twoFactorVerified],
    ([enabled, verified]) => {
        is2FASetupComplete.value = enabled && verified;
    },
);

const handleToggle = (value: boolean) => {
    if (!value && props.twoFactorEnabled && props.twoFactorVerified) {
        showDisable2FAModal.value = true;
    } else if (value) {
        generate2FAQR(isLoading.value, qrCodeUrl.value, show2FAModal.value, userService);
    }
};

const onSetupComplete = (enabled: boolean, verified: boolean) => {
    emit('update:two-factor-enabled', enabled);
    emit('update:two-factor-verified', verified);
    show2FAModal.value = false;
};

const onDisableComplete = (enabled: boolean, verified: boolean) => {
    emit('update:two-factor-enabled', enabled);
    emit('update:two-factor-verified', verified);
    showDisable2FAModal.value = false;
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

    <!-- 2FA Setup Modal -->
    <TwoFactorSetupModal v-model:open="show2FAModal" :qr-code-url="qrCodeUrl" :is-loading="isLoading" @setup-complete="onSetupComplete" />

    <!-- 2FA Disable Modal -->
    <TwoFactorDisableModal v-model:open="showDisable2FAModal" @disable-complete="onDisableComplete" />
</template>
