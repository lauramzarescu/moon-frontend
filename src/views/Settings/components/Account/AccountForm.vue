<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Separator } from '@/components/ui/separator';
import { UserService } from '@/services/user.service.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import PasswordChangeSection from './PasswordChangeSection.vue';
import TwoFactorAuthSection from './TwoFactorAuthSection.vue';

// Initialize services and stores
const userService = new UserService();
const authStore = useAuthStore();

// State for 2FA
const twoFactorEnabled = ref(false);
const twoFactorVerified = ref(false);

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
}

// Check if 2FA is already enabled
onMounted(async () => {
    try {
        const status = await userService.get2FAStatus();
        twoFactorEnabled.value = status.enabled;
        twoFactorVerified.value = status.verified;
    } catch (error) {
        console.error('Error checking 2FA status:', error);
    }
});
</script>

<template>
    <div>
        <h3 class="pt-5 text-lg font-medium">Account Management</h3>
        <p class="text-sm text-foreground">Change your account details</p>
    </div>
    <Separator />

    <div class="space-y-8">
        <!-- Password Change Section -->
        <PasswordChangeSection />

        <!-- Two-Factor Authentication Section -->
        <TwoFactorAuthSection
            :two-factor-enabled="twoFactorEnabled"
            :two-factor-verified="twoFactorVerified"
            @update:two-factor-enabled="twoFactorEnabled = $event"
            @update:two-factor-verified="twoFactorVerified = $event"
        />
    </div>
</template>
