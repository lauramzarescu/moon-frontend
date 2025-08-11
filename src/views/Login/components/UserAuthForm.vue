<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { computed, ref } from 'vue';
import { cn } from '@/utils.ts';
import { BriefcaseIcon, Loader2, ShieldCheckIcon, SmartphoneIcon } from 'lucide-vue-next';
import { AuthService } from '@/services/auth.service.ts';
import { UserService } from '@/services/user.service.ts';
import { type LoginWithEmailAndPassword, loginWithEmailAndPasswordSchema } from '@/views/Login/components/schema.ts';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'vue-router';
import VerificationCodeInput from '@/components/ui/verification-code-input/VerificationCodeInput.vue';
import Cookies from 'js-cookie';
import { config } from '../../../../app.config.ts';
import TwoFactorSetupModal from '@/views/Settings/components/Account/TwoFactorSetupModal.vue';
import { resetVerificationCode } from '@/utils/twoFactorUtils.ts';
import { TwoFactorMethod } from '@/enums/user/user.enum.ts';
import { startAuthentication } from '@simplewebauthn/browser';

const authService = new AuthService();
const userService = new UserService();
const router = useRouter();

const isLoading = ref(false);
const requires2FAVerification = ref(false);
const requires2FASetup = ref(false);
const verificationCode = ref(['', '', '', '', '', '']);
const sessionToken = ref(''); // Store the temporary session token
const twoFactorMethod = ref<TwoFactorMethod | null>(null);
const yubikeyOtp = ref('');
const useYubikey = ref(false);
const useWebAuthn = ref(false);
const webauthnChallengeId = ref('');

const show2FAModal = ref(false);
const qrCodeUrl = ref('');

// Security hierarchy information from login response
const hasTotp = ref(false);
const hasWebAuthn = ref(false);
const hasYubikey = ref(false);
const hasYubikeyOTP = ref(false);
const enforcedMethod = ref<'HIGH_SECURITY_ONLY' | 'WEBAUTHN_ONLY' | null>(null);
const availableMethods = ref<TwoFactorMethod[]>([]);

const formData = ref<LoginWithEmailAndPassword>({
    email: '',
    password: '',
});

async function onSubmit(event: Event) {
    event.preventDefault();
    isLoading.value = true;

    try {
        const validatedData = loginWithEmailAndPasswordSchema.parse(formData.value);
        const response = await authService.login(validatedData);

        if (response.requires2FAVerification) {
            const tempToken = Cookies.get('token');
            if (tempToken) {
                sessionToken.value = tempToken;
            }

            twoFactorMethod.value = (response.twoFactorMethod as TwoFactorMethod) || null;

            hasTotp.value = response.hasTotp ?? false;
            hasWebAuthn.value = response.hasWebAuthn ?? false;
            hasYubikey.value = response.hasYubikey ?? false;
            hasYubikeyOTP.value = response.hasYubikeyOTP ?? false;
            enforcedMethod.value = response.enforcedMethod ?? null;
            availableMethods.value = response.availableMethods ?? [];

            setInitialVerificationMethod();

            requires2FAVerification.value = true;
            isLoading.value = false;
        } else if (response.requires2FASetup && response.qrCodeUrl) {
            const tempToken = Cookies.get('token');
            if (tempToken) {
                sessionToken.value = tempToken;
            }

            requires2FASetup.value = true;
            qrCodeUrl.value = response.qrCodeUrl;
            show2FAModal.value = true;
            isLoading.value = false;
        } else if (response.status === 'success') {
            window.location.href = '/';
        } else {
            toast({
                title: 'Login Failed',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
            isLoading.value = false;
        }
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Invalid email or password',
            variant: 'destructive',
        });
        isLoading.value = false;
    }
}

async function verifyTwoFactorCode() {
    if (useWebAuthn.value) {
        // WebAuthn authentication
        try {
            isLoading.value = true;

            const authResponse = await userService.startWebAuthnAuthentication({}, sessionToken.value);
            webauthnChallengeId.value = authResponse.challengeId;
            const credential = await startAuthentication({ optionsJSON: authResponse });

            await userService.completeWebAuthnAuthentication(
                {
                    credential,
                    challengeId: webauthnChallengeId.value,
                },
                sessionToken.value,
            );

            window.location.href = '/';
            return;
        } catch (error: any) {
            console.error('WebAuthn authentication error:', error);

            let errorMessage = 'WebAuthn authentication failed. Please try again.';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Authentication was cancelled or timed out. Please try again.';
            } else if (error.name === 'SecurityError') {
                errorMessage = "Security error occurred. Please ensure you're using HTTPS.";
            } else if (error.name === 'AbortError') {
                errorMessage = 'Authentication was cancelled. Please try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: 'WebAuthn Authentication Failed',
                description: errorMessage,
                variant: 'destructive',
            });
            isLoading.value = false;
            return;
        }
    }

    // Handle TOTP and YubiKey OTP
    let code = '';

    if (useYubikey.value) {
        // YubiKey OTP validation
        if (!yubikeyOtp.value || yubikeyOtp.value.length < 32) {
            toast({
                title: 'Verification Error',
                description: 'Please provide a valid YubiKey OTP',
                variant: 'destructive',
            });
            return;
        }
        code = yubikeyOtp.value;
    } else {
        // TOTP validation
        if (verificationCode.value.join('').length !== 6) {
            toast({
                title: 'Verification Error',
                description: 'Please enter a valid 6-digit verification code',
                variant: 'destructive',
            });
            return;
        }
        code = verificationCode.value.join('');
    }

    isLoading.value = true;

    try {
        if (sessionToken.value) {
            await userService.verify2FASession(code, sessionToken.value);
        } else {
            await userService.verify2FASession(code);
        }

        window.location.href = '/';
    } catch (error) {
        console.error('2FA verification error:', error);

        if (useYubikey.value) {
            yubikeyOtp.value = '';
        } else if (!useWebAuthn.value) {
            resetVerificationCode(verificationCode.value, 'login-2fa');
        }

        toast({
            title: 'Verification Failed',
            description: 'The verification code you entered is incorrect. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
}

const onSetupComplete = (enabled: boolean, verified: boolean) => {
    show2FAModal.value = false;
    requires2FASetup.value = false;
    window.location.href = '/';
};

const handle2FAModalClose = (open: boolean) => {
    if (!open && !isLoading.value) {
        show2FAModal.value = false;
        requires2FASetup.value = false;
        // Reset form state
        formData.value = { email: '', password: '' };
        sessionToken.value = '';
    }
};

function cancelTwoFactorVerification() {
    requires2FAVerification.value = false;
    resetVerificationCode(verificationCode.value, 'login-2fa');
    yubikeyOtp.value = '';
    sessionToken.value = '';
}

function setInitialVerificationMethod() {
    switch (twoFactorMethod.value) {
        case TwoFactorMethod.YUBIKEY:
            // YUBIKEY method - check if it's WebAuthn or OTP based on what's available
            if (hasWebAuthn.value) {
                useWebAuthn.value = true;
                useYubikey.value = false;
            } else if (hasYubikeyOTP.value) {
                useYubikey.value = true;
                useWebAuthn.value = false;
            } else {
                // Fallback to OTP if nothing else is clear
                useYubikey.value = true;
                useWebAuthn.value = false;
            }
            break;
        case TwoFactorMethod.TOTP:
            useYubikey.value = false;
            useWebAuthn.value = false;
            break;
        case TwoFactorMethod.ANY:
            // For ANY method, prefer high-security methods
            if (enforcedMethod.value === 'WEBAUTHN_ONLY' && hasWebAuthn.value) {
                useWebAuthn.value = true;
                useYubikey.value = false;
            } else if (enforcedMethod.value === 'HIGH_SECURITY_ONLY') {
                // Prefer WebAuthn over TOTP for high security
                if (hasWebAuthn.value) {
                    useWebAuthn.value = true;
                    useYubikey.value = false;
                } else {
                    // Default to TOTP
                    useYubikey.value = false;
                    useWebAuthn.value = false;
                }
            } else {
                // Default to TOTP for ANY when no enforcement
                useYubikey.value = false;
                useWebAuthn.value = false;
            }
            break;
        default:
            useYubikey.value = false;
            useWebAuthn.value = false;
    }
}

function switchToTotp() {
    useYubikey.value = false;
    useWebAuthn.value = false;
    yubikeyOtp.value = '';
    resetVerificationCode(verificationCode.value, 'login-2fa');
}

function switchToYubikey() {
    useYubikey.value = true;
    useWebAuthn.value = false;
    resetVerificationCode(verificationCode.value, 'login-2fa');
    yubikeyOtp.value = '';
    // Focus on YubiKey input after switching
    setTimeout(() => {
        const yubikeyInput = document.getElementById('yubikey-otp');
        if (yubikeyInput) {
            yubikeyInput.focus();
        }
    }, 100);
}

function switchToWebAuthn() {
    useWebAuthn.value = true;
    useYubikey.value = false;
    yubikeyOtp.value = '';
    resetVerificationCode(verificationCode.value, 'login-2fa');
}

const canSwitchMethods = computed(() => {
    // Allow switching when method is ANY and multiple methods are available
    if (twoFactorMethod.value === TwoFactorMethod.ANY) {
        const availableCount = [hasTotp.value, hasWebAuthn.value, hasYubikeyOTP.value].filter(Boolean).length;
        return availableCount > 1;
    }
    return false;
});

const isVerificationReady = computed(() => {
    if (useYubikey.value) {
        return yubikeyOtp.value.length >= 32;
    } else if (useWebAuthn.value) {
        return true; // WebAuthn doesn't need pre-validation
    } else {
        return verificationCode.value.join('').length === 6;
    }
});

const handleSAMLLogin = async () => {
    window.location.href = `${config.BACKEND_URL}/auth/saml/login`;
};

// Navigation to separate password reset pages
const goToForgotPassword = () => {
    router.push('/forgot-password');
};

const goToResetPassword = () => {
    router.push('/reset-password');
};
</script>

<template>
    <div :class="cn('grid gap-6', $attrs.class ?? '')">
        <!-- Step 1: Email/Password Login -->
        <form v-if="!requires2FAVerification" @submit="onSubmit">
            <div class="grid gap-2">
                <div class="grid gap-1">
                    <Label class="sr-only" for="email"> Email </Label>
                    <Input
                        id="email"
                        v-model="formData.email"
                        placeholder="name@example.com"
                        type="email"
                        auto-capitalize="none"
                        auto-complete="email"
                        auto-correct="off"
                        :disabled="isLoading"
                    />

                    <Input
                        class="mt-1"
                        v-model="formData.password"
                        id="password"
                        placeholder="******"
                        type="password"
                        auto-capitalize="none"
                        auto-complete="password"
                        auto-correct="off"
                        :disabled="isLoading"
                    />
                </div>
                <Button :disabled="isLoading" class="mt-2">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    Sign In with Email
                </Button>

                <!-- Password Help Buttons -->
                <div class="flex flex-col space-y-2 pt-4 border-t">
                    <p class="text-sm text-gray-600 text-center">Need help with your password?</p>
                    <div class="flex justify-center flex-col sm:flex-row gap-2">
                        <Button variant="link" size="sm" type="button" @click="goToForgotPassword" :disabled="isLoading" class="text-xs">
                            Forgot Password?
                        </Button>
                    </div>
                </div>
            </div>
        </form>

        <!-- Debug: Show 2FA state -->
        <div v-if="requires2FAVerification" class="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
            <strong>DEBUG:</strong> 2FA Required - Method: {{ twoFactorMethod }} | TOTP: {{ hasTotp }} | WebAuthn: {{ hasWebAuthn }} |
            YubiKey: {{ hasYubikey }} | YubikeyOTP: {{ hasYubikeyOTP }}
        </div>

        <!-- Step 2: 2FA Verification -->
        <div v-if="requires2FAVerification" class="flex flex-col space-y-4">
            <div class="text-center">
                <h3 class="text-lg font-semibold flex items-center justify-center gap-2 mb-2">
                    <ShieldCheckIcon v-if="useYubikey || useWebAuthn" class="h-5 w-5 text-blue-600" />
                    <SmartphoneIcon v-else class="h-5 w-5 text-green-600" />
                    Two-Factor Authentication
                </h3>
                <p class="text-sm text-muted-foreground">
                    {{
                        useWebAuthn
                            ? "Click the button below and follow your browser's prompts to authenticate with your security key"
                            : useYubikey
                              ? 'Insert your YubiKey and touch the gold contact'
                              : 'Enter the 6-digit code from your authenticator app'
                    }}
                </p>
            </div>

            <!-- Method Switching (only show if multiple methods are available) -->
            <div v-if="canSwitchMethods" class="flex justify-center">
                <div class="flex items-center gap-1 p-1 bg-muted rounded-lg">
                    <Button
                        v-if="hasTotp"
                        :variant="!useYubikey && !useWebAuthn ? 'default' : 'ghost'"
                        size="sm"
                        @click="switchToTotp"
                        class="h-8 px-2 text-xs"
                    >
                        <SmartphoneIcon class="h-3 w-3 mr-1" />
                        TOTP
                    </Button>
                    <Button
                        v-if="hasYubikeyOTP"
                        :variant="useYubikey ? 'default' : 'ghost'"
                        size="sm"
                        @click="switchToYubikey"
                        class="h-8 px-2 text-xs"
                    >
                        <ShieldCheckIcon class="h-3 w-3 mr-1" />
                        YubiKey OTP
                    </Button>
                    <Button
                        v-if="hasWebAuthn"
                        :variant="useWebAuthn ? 'default' : 'ghost'"
                        size="sm"
                        @click="switchToWebAuthn"
                        class="h-8 px-2 text-xs"
                    >
                        <ShieldCheckIcon class="h-3 w-3 mr-1" />
                        YubiKey WebAuthn
                    </Button>
                </div>
            </div>

            <!-- WebAuthn Authentication -->
            <div v-if="useWebAuthn" class="space-y-4">
                <div class="text-center">
                    <Button @click="verifyTwoFactorCode" :disabled="isLoading" class="w-full">
                        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                        <ShieldCheckIcon v-else class="mr-2 h-4 w-4" />
                        Authenticate with Security Key
                    </Button>
                    <p class="text-xs text-muted-foreground mt-2">Click the button above and follow your browser's prompts</p>
                </div>
            </div>

            <!-- YubiKey Input -->
            <div v-else-if="useYubikey" class="space-y-2">
                <Label for="yubikey-otp" class="sr-only">YubiKey OTP</Label>
                <Input
                    id="yubikey-otp"
                    v-model="yubikeyOtp"
                    placeholder="Touch your YubiKey to generate OTP..."
                    :disabled="isLoading"
                    class="font-mono text-center"
                    @keydown.enter="verifyTwoFactorCode"
                />
                <p class="text-xs text-muted-foreground text-center">The OTP will be automatically entered when you touch your YubiKey</p>
            </div>

            <!-- TOTP Input -->
            <div v-else>
                <VerificationCodeInput
                    v-model:code="verificationCode"
                    prefix="login-2fa"
                    :disabled="isLoading"
                    @submit="verifyTwoFactorCode"
                />
            </div>

            <div v-if="!useWebAuthn" class="flex space-x-2 mt-4">
                <Button variant="outline" class="flex-1" @click="cancelTwoFactorVerification" :disabled="isLoading"> Back </Button>
                <Button class="flex-1" @click="verifyTwoFactorCode" :disabled="isLoading || !isVerificationReady">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    <span v-else>Verify</span>
                </Button>
            </div>
            <div v-else class="flex justify-center mt-4">
                <Button variant="outline" @click="cancelTwoFactorVerification" :disabled="isLoading"> Back</Button>
            </div>
        </div>

        <!-- Step 3: 2FA Setup Modal -->
        <TwoFactorSetupModal
            v-model:open="show2FAModal"
            :qr-code-url="qrCodeUrl"
            :is-loading="isLoading"
            :verify-session="true"
            :session-token="sessionToken"
            @setup-complete="onSetupComplete"
            @update:open="handle2FAModalClose"
        />

        <!-- SAML Login Option -->
        <div v-if="!requires2FAVerification" class="relative">
            <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background px-2 text-foreground"> Or continue with </span>
            </div>
        </div>
        <Button v-if="!requires2FAVerification" variant="outline" type="button" :disabled="isLoading" @click="handleSAMLLogin">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            <BriefcaseIcon v-else class="mr-2 h-4 w-4" />
            SAML
        </Button>
    </div>
</template>
