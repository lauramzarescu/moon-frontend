<template>
    <div class="space-y-4">
        <div>
            <h4 class="text-sm font-medium">Two-Factor Authentication Method</h4>
            <p class="text-sm text-muted-foreground">Choose your preferred 2FA method</p>
        </div>

        <div class="space-y-3">
            <!-- TOTP Method -->
            <div
                v-if="showTotpOption"
                :class="[
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                    selectedMethod === TwoFactorMethod.TOTP
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20',
                ]"
                @click="selectMethod(TwoFactorMethod.TOTP)"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                        <SmartphoneIcon class="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p class="text-sm font-medium">Mobile Auth (TOTP)</p>
                        <p class="text-xs text-muted-foreground">Use Google Authenticator, Authy, or similar apps</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-xs text-green-600">High Security</Badge>
                    <Badge v-if="totpEnabled || hasTotp" variant="secondary" class="text-xs"> Configured</Badge>
                    <div
                        :class="[
                            'w-4 h-4 rounded-full border-2',
                            selectedMethod === TwoFactorMethod.TOTP ? 'border-primary bg-primary' : 'border-muted-foreground',
                        ]"
                    >
                        <div v-if="selectedMethod === TwoFactorMethod.TOTP" class="w-2 h-2 bg-white rounded-full m-0.5" />
                    </div>
                </div>
            </div>

            <!-- YubiKey OTP Method (only shown when no webauthn methods) -->
            <div
                v-if="showYubikeyOtpOption"
                :class="[
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                    selectedMethod === TwoFactorMethod.YUBIKEY
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20',
                ]"
                @click="selectMethod(TwoFactorMethod.YUBIKEY)"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                        <ShieldCheckIcon class="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p class="text-sm font-medium">YubiKey OTP</p>
                        <p class="text-xs text-muted-foreground">Use YubiKey OTP (no PIN required)</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-xs text-orange-600">Lower Security</Badge>
                    <Badge v-if="yubikeyCount > 0" variant="secondary" class="text-xs">
                        {{ yubikeyCount }} key{{ yubikeyCount !== 1 ? 's' : '' }}
                    </Badge>
                    <div
                        :class="[
                            'w-4 h-4 rounded-full border-2',
                            selectedMethod === TwoFactorMethod.YUBIKEY ? 'border-primary bg-primary' : 'border-muted-foreground',
                        ]"
                    >
                        <div v-if="selectedMethod === TwoFactorMethod.YUBIKEY" class="w-2 h-2 bg-white rounded-full m-0.5" />
                    </div>
                </div>
            </div>

            <!-- YubiKey WebAuthn Method (high security) -->
            <div
                v-if="showYubikeyWebAuthnOption"
                :class="[
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                    selectedMethod === TwoFactorMethod.YUBIKEY
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20',
                ]"
                @click="selectMethod(TwoFactorMethod.YUBIKEY)"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                        <ShieldCheckIcon class="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p class="text-sm font-medium">YubiKey (WebAuthn)</p>
                        <p class="text-xs text-muted-foreground">Use WebAuthn-compatible YubiKey with PIN protection</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-xs text-green-600">High Security</Badge>
                    <Badge v-if="webauthnCount > 0" variant="secondary" class="text-xs">
                        {{ webauthnCount }} key{{ webauthnCount !== 1 ? 's' : '' }}
                    </Badge>
                    <div
                        :class="[
                            'w-4 h-4 rounded-full border-2',
                            selectedMethod === TwoFactorMethod.YUBIKEY ? 'border-primary bg-primary' : 'border-muted-foreground',
                        ]"
                    >
                        <div v-if="selectedMethod === TwoFactorMethod.YUBIKEY" class="w-2 h-2 bg-white rounded-full m-0.5" />
                    </div>
                </div>
            </div>

            <!-- Any Method -->
            <div
                v-if="availableMethods?.length > 1"
                :class="[
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                    selectedMethod === TwoFactorMethod.ANY
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/20',
                ]"
                @click="selectMethod(TwoFactorMethod.ANY)"
            >
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                        <ShieldIcon class="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p class="text-sm font-medium">Any High-Security Method</p>
                        <p class="text-xs text-muted-foreground">Accept Mobile Auth or YubiKey WebAuthn for authentication</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-xs text-green-600">High Security</Badge>
                    <Badge variant="secondary" class="text-xs">Available</Badge>
                    <div
                        :class="[
                            'w-4 h-4 rounded-full border-2',
                            selectedMethod === TwoFactorMethod.ANY ? 'border-primary bg-primary' : 'border-muted-foreground',
                        ]"
                    >
                        <div v-if="selectedMethod === TwoFactorMethod.ANY" class="w-2 h-2 bg-white rounded-full m-0.5" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
            <Button @click="saveMethod" :disabled="!hasChanges || isLoading || !canSelectMethod" size="sm">
                <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                Save Method
            </Button>
        </div>

        <!-- Requirements Notice -->
        <div v-if="!canSelectMethod" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950 dark:border-yellow-800">
            <div class="flex items-start gap-2">
                <AlertTriangleIcon class="h-4 w-4 text-yellow-600 mt-0.5" />
                <div class="text-sm">
                    <p class="font-medium text-yellow-800 dark:text-yellow-200">Setup Required</p>
                    <p class="text-yellow-700 dark:text-yellow-300">
                        {{ getRequirementMessage() }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangleIcon, Loader2Icon, ShieldCheckIcon, ShieldIcon, SmartphoneIcon } from 'lucide-vue-next';
import { TwoFactorMethod } from '@/enums/user/user.enum.ts';
import { UserService } from '@/services/user.service.ts';
import { toast } from '@/components/ui/toast'; // No props needed - component fetches its own data

// No props needed - component fetches its own data

const emit = defineEmits<{
    'method-updated': [];
}>();

const userService = new UserService();

const isLoading = ref(false);

// Internal 2FA status - fetched on mount
const currentMethod = ref<TwoFactorMethod | null>(null);
const selectedMethod = ref<TwoFactorMethod | null>(null);
const totpEnabled = ref(false);
const yubikeyCount = ref(0);
const webauthnCount = ref(0);
const securityLevel = ref<'HIGH' | 'MEDIUM' | 'LOW' | null>(null);
const enforcedMethod = ref<'HIGH_SECURITY_ONLY' | 'WEBAUTHN_ONLY' | null>(null);
const availableMethods = ref<TwoFactorMethod[]>([]);
const hasTotp = ref(false);
const hasYubikeyOtp = ref(false);
const is2FAStatusLoaded = ref(false);

// Security hierarchy computed properties
const hasHighSecurityMethods = computed(() => hasTotp.value || webauthnCount.value > 0);
const isHighSecurityEnforced = computed(() => enforcedMethod.value === 'HIGH_SECURITY_ONLY');
const isWebAuthnOnlyEnforced = computed(() => enforcedMethod.value === 'WEBAUTHN_ONLY');

// Show only high-security methods when enforced
const showTotpOption = computed(() => {
    if (isWebAuthnOnlyEnforced.value) return false;
    return hasTotp.value || totpEnabled.value;
});

const showYubikeyWebAuthnOption = computed(() => {
    return webauthnCount.value > 0;
});

const showYubikeyOtpOption = computed(() => {
    if (showYubikeyWebAuthnOption.value) return false; // Hide OTP when Webauthn high-security method exist
    return hasYubikeyOtp.value;
});

const hasChanges = computed(() => {
    return selectedMethod.value !== currentMethod.value;
});

const canSelectMethod = computed(() => {
    switch (selectedMethod.value) {
        case TwoFactorMethod.TOTP:
            return showTotpOption.value;
        case TwoFactorMethod.YUBIKEY:
            // For YUBIKEY method, check if it's WebAuthn or OTP based on context
            if (isWebAuthnOnlyEnforced.value) {
                return showYubikeyWebAuthnOption.value;
            }
            return showYubikeyWebAuthnOption.value || showYubikeyOtpOption.value;
        case TwoFactorMethod.ANY:
            // ANY method requires at least one high-security method when enforced
            if (isHighSecurityEnforced.value || isWebAuthnOnlyEnforced.value) {
                return showTotpOption.value || showYubikeyWebAuthnOption.value;
            }
            return showTotpOption.value || showYubikeyWebAuthnOption.value || showYubikeyOtpOption.value;
        default:
            return false;
    }
});

const selectMethod = (method: TwoFactorMethod) => {
    selectedMethod.value = method;
};

const getRequirementMessage = () => {
    switch (selectedMethod.value) {
        case TwoFactorMethod.TOTP:
            return 'Please set up TOTP authentication first.';
        case TwoFactorMethod.YUBIKEY:
            return 'Please register at least one YubiKey first.';
        case TwoFactorMethod.ANY:
            if (!totpEnabled.value && yubikeyCount.value === 0) {
                return 'Please set up both TOTP authentication and register a YubiKey.';
            } else if (!totpEnabled.value) {
                return 'Please set up TOTP authentication first.';
            } else {
                return 'Please register at least one YubiKey first.';
            }
        default:
            return '';
    }
};

const saveMethod = async () => {
    if (!canSelectMethod.value) return;

    try {
        isLoading.value = true;
        await userService.setTwoFactorMethod({
            method: selectedMethod.value,
        });

        emit('method-updated');

        toast({
            title: '2FA method updated',
            description: 'Your two-factor authentication method has been updated successfully.',
            variant: 'success',
        });
    } catch (error) {
        console.error('Error updating 2FA method:', error);
        toast({
            title: 'Error updating method',
            description: 'Failed to update your 2FA method. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};

const fetch2FAStatus = async () => {
    try {
        const twoFactorStatus = await userService.get2FAStatus();

        // Get current method from status
        currentMethod.value = twoFactorStatus.method ?? null;
        selectedMethod.value = currentMethod.value ?? TwoFactorMethod.TOTP;

        totpEnabled.value = twoFactorStatus.enabled ?? false;
        hasTotp.value = twoFactorStatus.hasTotp ?? false;
        hasYubikeyOtp.value = twoFactorStatus.hasYubikeyOTP ?? false;
        securityLevel.value = twoFactorStatus.securityLevel ?? null;
        enforcedMethod.value = twoFactorStatus.enforcedMethod ?? null;
        availableMethods.value = twoFactorStatus.availableMethods ?? [];
        yubikeyCount.value = twoFactorStatus.yubikeyCount ?? 0;
        webauthnCount.value = twoFactorStatus.webauthnCount ?? 0;

        is2FAStatusLoaded.value = true;
    } catch (error) {
        console.error('TwoFactorMethodSelection - Failed to fetch 2FA status:', error);
        // Set safe defaults
        totpEnabled.value = false;
        hasTotp.value = false;
        hasYubikeyOtp.value = false;
        yubikeyCount.value = 0;
        webauthnCount.value = 0;
        is2FAStatusLoaded.value = true;
    }
};

onMounted(() => {
    fetch2FAStatus();
});

const refresh2FAStatus = () => {
    fetch2FAStatus();
};

defineExpose({
    refresh2FAStatus,
});
</script>
