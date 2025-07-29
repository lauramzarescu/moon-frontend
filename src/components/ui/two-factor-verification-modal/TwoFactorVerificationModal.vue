<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <ShieldCheckIcon class="h-5 w-5 text-blue-600" />
                    {{ title }}
                </DialogTitle>
                <DialogDescription>
                    {{ description }}
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-4">
                <!-- Method Switching (only show if user has multiple methods available) -->
                <div v-if="canSwitchMethods" class="flex justify-center">
                    <div class="flex items-center gap-1 p-1 bg-muted rounded-lg">
                        <Button
                            v-if="hasTotp"
                            :variant="!useYubikey && !useYubikeyWebAuthn ? 'default' : 'ghost'"
                            size="sm"
                            @click="switchToTotp"
                            class="h-8 px-2 text-xs"
                        >
                            <SmartphoneIcon class="h-3 w-3 mr-1" />
                            TOTP
                        </Button>
                        <Button
                            v-if="hasYubikeyOTP && !hasYubikeyWebAuthn"
                            :variant="useYubikey ? 'default' : 'ghost'"
                            size="sm"
                            @click="switchToYubikeyOtp"
                            class="h-8 px-2 text-xs"
                        >
                            <ShieldCheckIcon class="h-3 w-3 mr-1" />
                            YubiKey OTP
                        </Button>
                        <Button
                            v-if="hasYubikeyWebAuthn"
                            :variant="useYubikeyWebAuthn ? 'default' : 'ghost'"
                            size="sm"
                            @click="switchToYubikeyWebAuthn"
                            class="h-8 px-2 text-xs"
                        >
                            <ShieldCheckIcon class="h-3 w-3 mr-1" />
                            YubiKey WebAuthn
                        </Button>
                    </div>
                </div>

                <!-- YubiKey WebAuthn Authentication -->
                <div v-if="useYubikeyWebAuthn" class="space-y-4">
                    <div class="text-center">
                        <Button @click="handleVerify" :disabled="isLoading" class="w-full">
                            <Loader2Icon v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                            <ShieldCheckIcon v-else class="mr-2 h-4 w-4" />
                            Authenticate with YubiKey WebAuthn
                        </Button>
                        <p class="text-xs text-muted-foreground mt-2">Click the button above and follow your browser's prompts</p>
                    </div>
                </div>

                <!-- YubiKey OTP Input -->
                <div v-else-if="useYubikey" class="space-y-2">
                    <Label for="verification-yubikey-otp" class="sr-only">YubiKey OTP</Label>
                    <Input
                        id="verification-yubikey-otp"
                        v-model="yubikeyOtp"
                        placeholder="Touch your YubiKey to generate OTP..."
                        :disabled="isLoading"
                        class="font-mono text-center"
                        @keydown.enter="handleVerify"
                    />
                    <p class="text-xs text-muted-foreground text-center">
                        The OTP will be automatically entered when you touch your YubiKey
                    </p>
                </div>

                <!-- TOTP Input -->
                <div v-else>
                    <VerificationCodeInput
                        v-model:code="verificationCode"
                        :prefix="inputPrefix"
                        :disabled="isLoading"
                        @submit="handleVerify"
                    />
                </div>

                <!-- Error Message -->
                <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800">
                    <div class="flex items-center gap-2">
                        <AlertTriangleIcon class="h-4 w-4 text-red-600" />
                        <span class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</span>
                    </div>
                </div>
            </div>

            <DialogFooter v-if="!useYubikeyWebAuthn">
                <Button variant="outline" @click="handleCancel" :disabled="isLoading"> Cancel</Button>
                <Button @click="handleVerify" :disabled="isLoading || !isVerificationReady">
                    <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    Verify
                </Button>
            </DialogFooter>
            <DialogFooter v-else>
                <Button variant="outline" @click="handleCancel" :disabled="isLoading"> Cancel</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangleIcon, Loader2Icon, ShieldCheckIcon, SmartphoneIcon } from 'lucide-vue-next';
import { TwoFactorMethod, YubikeyAuthType } from '@/enums/user/user.enum.ts';
import { resetVerificationCode } from '@/utils/twoFactorUtils.ts';
import VerificationCodeInput from '@/components/ui/verification-code-input/VerificationCodeInput.vue';
import { startAuthentication } from '@simplewebauthn/browser';
import { UserService } from '@/services/user.service.ts';

const props = defineProps<{
    open: boolean;
    title?: string;
    description?: string;
    inputPrefix?: string;
    sessionToken?: string;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    verify: [code: string];
    cancel: [];
}>();

const userService = new UserService();

const isOpen = ref(props.open);
const verificationCode = ref(['', '', '', '', '', '']);
const yubikeyOtp = ref('');
const useYubikey = ref(false);
const useYubikeyWebAuthn = ref(false);
const webauthnChallengeId = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

// Internal 2FA status - fetched when modal opens
const hasTotp = ref(false);
const hasYubikeyOTP = ref(false);
const hasYubikeyWebAuthn = ref(false);
const yubikeyAuthType = ref<YubikeyAuthType | null>(null);
const is2FAStatusLoaded = ref(false);
const twoFactorMethod = ref<TwoFactorMethod | null>(null);

const inputPrefix = computed(() => props.inputPrefix || 'verification-2fa');

const canSwitchMethods = computed(() => {
    return twoFactorMethod.value === TwoFactorMethod.ANY;
});

const isVerificationReady = computed(() => {
    if (useYubikeyWebAuthn.value) {
        return true; // WebAuthn doesn't need pre-validation
    } else if (useYubikey.value) {
        return yubikeyOtp.value.length >= 32;
    } else {
        return verificationCode.value.join('').length === 6;
    }
});

watch(
    () => props.open,
    async (newValue) => {
        isOpen.value = newValue;
        if (newValue) {
            resetForm();
            await fetch2FAStatus();
            setInitialVerificationMethod();
        }
    },
);

watch(isOpen, (newValue) => {
    emit('update:open', newValue);
});

const fetch2FAStatus = async () => {
    try {
        console.log('TwoFactorVerificationModal - Fetching 2FA status...');
        const twoFactorStatus = await userService.get2FAStatus();

        hasTotp.value = twoFactorStatus.hasTotp ?? false;
        hasYubikeyOTP.value = twoFactorStatus.hasYubikeyOTP ?? false;
        hasYubikeyWebAuthn.value = twoFactorStatus.hasWebAuthn ?? false;
        twoFactorMethod.value = twoFactorStatus.method ?? TwoFactorMethod.TOTP;

        // Determine YubiKey auth type based on what's available
        if (hasYubikeyWebAuthn.value) {
            yubikeyAuthType.value = YubikeyAuthType.WEBAUTHN;
        } else if (hasYubikeyOTP.value) {
            yubikeyAuthType.value = YubikeyAuthType.OTP;
        } else {
            yubikeyAuthType.value = null;
        }

        is2FAStatusLoaded.value = true;
    } catch (error) {
        console.error('TwoFactorVerificationModal - Failed to fetch 2FA status:', error);
        // Set defaults on error
        hasTotp.value = true; // Assume TOTP is available as fallback
        hasYubikeyOTP.value = false;
        hasYubikeyWebAuthn.value = false;
        yubikeyAuthType.value = null;
        is2FAStatusLoaded.value = true;
    }
};

const setInitialVerificationMethod = () => {
    switch (twoFactorMethod.value) {
        case TwoFactorMethod.YUBIKEY:
            // Determine YubiKey type based on AuthType or available methods
            if (yubikeyAuthType.value === YubikeyAuthType.WEBAUTHN || hasYubikeyWebAuthn.value) {
                useYubikeyWebAuthn.value = true;
                useYubikey.value = false;
            } else {
                useYubikey.value = true;
                useYubikeyWebAuthn.value = false;
            }
            break;
        case TwoFactorMethod.TOTP:
            useYubikey.value = false;
            useYubikeyWebAuthn.value = false;
            break;
        case TwoFactorMethod.ANY:
            // For ANY method, prefer high-security methods
            if (hasYubikeyWebAuthn.value) {
                useYubikeyWebAuthn.value = true;
                useYubikey.value = false;
            } else if (hasTotp.value) {
                useYubikey.value = false;
                useYubikeyWebAuthn.value = false;
            } else if (hasYubikeyOTP.value) {
                useYubikey.value = true;
                useYubikeyWebAuthn.value = false;
            } else {
                // Default to TOTP
                useYubikey.value = false;
                useYubikeyWebAuthn.value = false;
            }
            break;
        default:
            useYubikey.value = false;
            useYubikeyWebAuthn.value = false;
    }

    console.log('TwoFactorVerificationModal - Method set to:', {
        useTotp: !useYubikey.value && !useYubikeyWebAuthn.value,
        useYubikey: useYubikey.value,
        useYubikeyWebAuthn: useYubikeyWebAuthn.value,
    });
};

const switchToTotp = () => {
    useYubikey.value = false;
    useYubikeyWebAuthn.value = false;
    yubikeyOtp.value = '';
    webauthnChallengeId.value = '';
    resetVerificationCode(verificationCode.value, inputPrefix.value);
    errorMessage.value = '';
};

const switchToYubikeyOtp = () => {
    useYubikey.value = true;
    useYubikeyWebAuthn.value = false;
    webauthnChallengeId.value = '';
    resetVerificationCode(verificationCode.value, inputPrefix.value);
    yubikeyOtp.value = '';
    errorMessage.value = '';

    // Focus on YubiKey input after switching
    setTimeout(() => {
        const yubikeyInput = document.getElementById('verification-yubikey-otp');
        if (yubikeyInput) {
            yubikeyInput.focus();
        }
    }, 100);
};

const switchToYubikeyWebAuthn = () => {
    useYubikeyWebAuthn.value = true;
    useYubikey.value = false;
    yubikeyOtp.value = '';
    resetVerificationCode(verificationCode.value, inputPrefix.value);
    errorMessage.value = '';
};

const resetForm = () => {
    verificationCode.value = ['', '', '', '', '', ''];
    yubikeyOtp.value = '';
    webauthnChallengeId.value = '';
    errorMessage.value = '';
    isLoading.value = false;
};

const handleVerify = () => {
    if (!isVerificationReady.value || isLoading.value) return;

    if (useYubikeyWebAuthn.value) {
        handleWebAuthnVerify();
    } else {
        const code = useYubikey.value ? yubikeyOtp.value : verificationCode.value.join('');
        emit('verify', code);
    }
};

const handleWebAuthnVerify = async () => {
    try {
        isLoading.value = true;
        errorMessage.value = '';

        console.log('TwoFactorVerificationModal - Starting WebAuthn authentication:', {
            hasSessionToken: !!props.sessionToken,
            context: props.sessionToken ? 'login' : 'authenticated',
        });

        // Use different routes based on authentication context
        let authResponse;
        if (props.sessionToken) {
            // Login context - use session-based authentication
            console.log('Using login WebAuthn routes with session token');
            authResponse = await userService.startWebAuthnAuthentication({}, props.sessionToken);
        } else {
            // Authenticated context - use re-authentication routes
            console.log('Using re-authentication WebAuthn routes');
            authResponse = await userService.startWebAuthnReAuthentication({});
        }

        webauthnChallengeId.value = authResponse.challengeId;

        // Use SimpleWebAuthn to handle the browser WebAuthn API
        const credential = await startAuthentication({ optionsJSON: authResponse });

        // Complete authentication with appropriate method
        if (props.sessionToken) {
            // Login context
            await userService.completeWebAuthnAuthentication(
                {
                    credential,
                    challengeId: webauthnChallengeId.value,
                },
                props.sessionToken,
            );
        } else {
            // Authenticated context
            await userService.completeWebAuthnReAuthentication({
                credential,
                challengeId: webauthnChallengeId.value,
            });
        }

        // Emit success - the parent component will handle the success
        emit('verify', 'webauthn-success');
    } catch (error: any) {
        console.error('WebAuthn verification error:', error);

        let errorMsg = 'WebAuthn authentication failed. Please try again.';
        if (error.name === 'NotAllowedError') {
            errorMsg = 'Authentication was cancelled or timed out. Please try again.';
        } else if (error.name === 'SecurityError') {
            errorMsg = "Security error occurred. Please ensure you're using HTTPS.";
        } else if (error.name === 'AbortError') {
            errorMsg = 'Authentication was cancelled. Please try again.';
        } else if (error.message) {
            errorMsg = error.message;
        }

        errorMessage.value = errorMsg;
    } finally {
        isLoading.value = false;
    }
};

const handleCancel = () => {
    emit('cancel');
    isOpen.value = false;
};

const setLoading = (loading: boolean) => {
    isLoading.value = loading;
};

const setError = (error: string) => {
    errorMessage.value = error;
    if (useYubikey.value) {
        yubikeyOtp.value = '';
    } else {
        resetVerificationCode(verificationCode.value, inputPrefix.value);
    }
};

const clearError = () => {
    errorMessage.value = '';
};

// Expose methods for parent components
defineExpose({
    setLoading,
    setError,
    clearError,
});
</script>
