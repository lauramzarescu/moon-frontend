<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Separator } from '@/components/ui/separator';
import { UserService } from '@/services/user.service.ts';
import { TwoFactorMethod } from '@/enums/user/user.enum.ts';
import PasswordChangeSection from './PasswordChangeSection.vue';
import TwoFactorAuthSection from './TwoFactorAuthSection.vue';
import AuthorizedDevicesSection from './AuthorizedDevicesSection.vue';

const userService = new UserService();

const twoFactorEnabled = ref(false);
const twoFactorVerified = ref(false);
const twoFactorMethod = ref<TwoFactorMethod | null>(null);
const yubikeyCount = ref(0);

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
}

const load2FAStatus = async () => {
    try {
        const status = await userService.get2FAStatus();

        twoFactorEnabled.value = status.enabled;
        twoFactorVerified.value = status.verified;
        twoFactorMethod.value = status.method ?? null;
        yubikeyCount.value = status.yubikeyCount ?? 0;
    } catch (error) {
        console.error('Error checking 2FA status:', error);
    }
};

onMounted(async () => {
    await load2FAStatus();
});

const handle2FAStatusUpdate = async () => {
    console.log('AccountForm: Received status-updated event, refreshing 2FA status');
    setTimeout(async () => await load2FAStatus(), 301);
    console.log('AccountForm: 2FA status refreshed');
};
</script>

<template>
    <div>
        <h3 class="pt-5 text-lg font-medium">Account Management</h3>
        <p class="text-sm text-foreground">Change your account details</p>
    </div>
    <Separator />

    <div class="space-y-8">
        <!-- Password Change Section -->
        <PasswordChangeSection :two-factor-method="twoFactorMethod" />

        <!-- Two-Factor Authentication Section -->
        <TwoFactorAuthSection
            :two-factor-enabled="twoFactorEnabled"
            :two-factor-verified="twoFactorVerified"
            :two-factor-method="twoFactorMethod"
            :yubikey-count="yubikeyCount"
            @update:two-factor-enabled="twoFactorEnabled = $event"
            @update:two-factor-verified="twoFactorVerified = $event"
            @status-updated="handle2FAStatusUpdate"
        />

        <!-- Authorized Devices Section -->
        <AuthorizedDevicesSection :two-factor-enabled="twoFactorEnabled && twoFactorVerified" />
    </div>
</template>
