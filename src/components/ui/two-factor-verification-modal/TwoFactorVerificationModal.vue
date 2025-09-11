<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <ShieldCheckIcon class="h-5 w-5 text-primary" />
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
import { Loader2Icon, ShieldCheckIcon, SmartphoneIcon } from 'lucide-vue-next';
import { TwoFactorMethod, YubikeyAuthType } from '@/enums/user/user.enum.ts';
import { resetVerificationCode } from '@/utils/twoFactorUtils.ts';
import { setInitialVerificationMethod } from '@/utils/twoFactorMethodUtils.ts';
import VerificationCodeInput from '@/components/ui/verification-code-input/VerificationCodeInput.vue';
import type { AuthenticationResponseJSON } from '@simplewebauthn/browser';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { UserService } from '@/services/user.service.ts';
import { toast } from '@/components/ui/toast';

const props = defineProps<{
    open: boolean;
    title?: string;
    description?: string;
    inputPrefix?: string;
    sessionToken?: string;
    isPasswordChangeFlow?: boolean;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    verify: [{ code: string; credential?: AuthenticationResponseJSON; challengeId?: string }];
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
            setInitialVerificationMethodLocal();
        }
    },
);

watch(isOpen, (newValue) => {
    emit('update:open', newValue);
});

const fetch2FAStatus = async () => {
    try {
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

const setInitialVerificationMethodLocal = () => {
    setInitialVerificationMethod(
        twoFactorMethod,
        {
            hasTotp,
            hasYubikeyOTP,
            hasYubikeyWebAuthn,
            yubikeyAuthType,
        },
        {
            useYubikey,
            useYubikeyWebAuthn,
        },
    );
};

const switchToTotp = () => {
    useYubikey.value = false;
    useYubikeyWebAuthn.value = false;
    yubikeyOtp.value = '';
    webauthnChallengeId.value = '';
    resetVerificationCode(verificationCode.value, inputPrefix.value);
};

const switchToYubikeyOtp = () => {
    useYubikey.value = true;
    useYubikeyWebAuthn.value = false;
    webauthnChallengeId.value = '';
    resetVerificationCode(verificationCode.value, inputPrefix.value);
    yubikeyOtp.value = '';

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
};

const resetForm = () => {
    verificationCode.value = ['', '', '', '', '', ''];
    yubikeyOtp.value = '';
    webauthnChallengeId.value = '';
    isLoading.value = false;
};

const handleVerify = () => {
    if (!isVerificationReady.value || isLoading.value) return;

    if (useYubikeyWebAuthn.value) {
        handleWebAuthnVerify();
    } else {
        const code = useYubikey.value ? yubikeyOtp.value : verificationCode.value.join('');
        emit('verify', { code });
    }
};

const handleWebAuthnVerify = async () => {
    if (props.isPasswordChangeFlow) {
        emit('verify', { code: 'webauthn-pending' });
        return;
    }

    try {
        isLoading.value = true;

        if (!browserSupportsWebAuthn()) {
            throw new Error(
                'WebAuthn is not supported in your browser. Please use a different authentication method or update your browser.',
            );
        }

        let authResponse;
        if (props.sessionToken) {
            authResponse = await userService.startWebAuthnAuthentication({}, props.sessionToken);
        } else {
            authResponse = await userService.startWebAuthnReAuthentication({});
        }

        if (!authResponse.challengeId) {
            throw new Error('Invalid authentication response: missing challengeId');
        }

        if (
            (authResponse.options.allowCredentials && authResponse.options.allowCredentials.length === 0) ||
            authResponse.options.allowCredentials === undefined
        ) {
            console.warn('WebAuthn allowCredentials is not valid - no registered credentials found');
            throw new Error('No registered security keys found for this account. Please register a security key first.');
        }

        webauthnChallengeId.value = authResponse.challengeId;
        let credential;

        try {
            credential = await startAuthentication({
                optionsJSON: authResponse.options,
                useBrowserAutofill: false,
            });
        } catch (firstError: any) {
            if (firstError.name === 'NotAllowedError' && authResponse.options.allowCredentials) {
                const fallbackOptions = { ...authResponse };
                delete fallbackOptions.options.allowCredentials;

                try {
                    credential = await startAuthentication({
                        optionsJSON: fallbackOptions.options,
                        useBrowserAutofill: false,
                    });
                } catch (secondError: any) {
                    throw secondError;
                }
            } else {
                throw firstError;
            }
        }

        if (authResponse.options.allowCredentials && authResponse.options.allowCredentials.length > 0) {
            const credentialMatches = authResponse.options.allowCredentials.some((allowedCred: any) => {
                return allowedCred.id === credential.id;
            });

            if (!credentialMatches) {
                console.warn('WARNING: Returned credential does not match any allowed credential!');
            }
        }

        if (props.sessionToken) {
            await userService.completeWebAuthnAuthentication(
                {
                    credential,
                    challengeId: webauthnChallengeId.value,
                },
                props.sessionToken,
            );
        } else {
            await userService.completeWebAuthnReAuthentication({
                credential,
                challengeId: webauthnChallengeId.value,
            });
        }

        emit('verify', { code: 'webauthn-success', credential, challengeId: webauthnChallengeId.value });
    } catch (error: any) {
        console.error('WebAuthn verification error:', error);

        // Show error as toast
        toast({
            title: 'WebAuthn Authentication Failed',
            description: error.message || 'WebAuthn authentication failed. Please try again.',
            variant: 'destructive',
        });

        // Close the dialog
        isOpen.value = false;
        emit('cancel');
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
    toast({
        title: 'Verification Failed',
        description: error,
        variant: 'destructive',
    });

    isOpen.value = false;
    emit('cancel');
};

defineExpose({
    setLoading,
    setError,
});
</script>
