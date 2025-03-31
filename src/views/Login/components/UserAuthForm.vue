<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ref } from 'vue';
import { cn } from '@/utils.ts';
import { BriefcaseIcon, Loader2 } from 'lucide-vue-next';
import { AuthService } from '@/services/auth.service.ts';
import { UserService } from '@/services/user.service.ts';
import {
    type LoginWithEmailAndPassword,
    loginWithEmailAndPasswordResponseSchema,
    loginWithEmailAndPasswordSchema,
} from '@/views/Login/components/schema.ts';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'vue-router';
import { resetVerificationCode } from '@/utils/twoFactorUtils.ts';
import VerificationCodeInput from '@/components/ui/verification-code-input/VerificationCodeInput.vue';
import Cookies from 'js-cookie';
import { config } from '../../../../app.config.ts';

const authService = new AuthService();
const userService = new UserService();
const router = useRouter();

const isLoading = ref(false);
const requires2FAVerification = ref(false);
const verificationCode = ref(['', '', '', '', '', '']);
const sessionToken = ref(''); // Store the temporary session token

const formData = ref<LoginWithEmailAndPassword>({
    email: '',
    password: '',
});

async function onSubmit(event: Event) {
    event.preventDefault();
    isLoading.value = true;

    try {
        const validatedData = loginWithEmailAndPasswordSchema.parse(formData.value);
        const response = loginWithEmailAndPasswordResponseSchema.parse(await authService.login(validatedData));

        if (response.requires2FAVerification) {
            const tempToken = Cookies.get('token');
            if (tempToken) {
                sessionToken.value = tempToken;
            }

            requires2FAVerification.value = true;
            isLoading.value = false;
        } else if (response.status === 'success') {
            window.location.href = '/';
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
    if (verificationCode.value.join('').length !== 6) {
        toast({
            title: 'Verification Error',
            description: 'Please enter a valid 6-digit verification code',
            variant: 'destructive',
        });
        return;
    }

    isLoading.value = true;

    try {
        const code = verificationCode.value.join('');

        if (sessionToken.value) {
            await userService.verify2FASession(code, sessionToken.value);
        } else {
            await userService.verify2FASession(code);
        }

        window.location.href = '/';
    } catch (error) {
        resetVerificationCode(verificationCode.value, 'login-2fa');

        toast({
            title: 'Verification Failed',
            description: 'The verification code you entered is incorrect. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
}

function cancelTwoFactorVerification() {
    requires2FAVerification.value = false;
    resetVerificationCode(verificationCode.value, 'login-2fa');
    sessionToken.value = ''; // Clear the session token
}

const handleSAMLLogin = async () => {
    window.location.href = `${config.BACKEND_URL}/auth/saml/login`;
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
            </div>
        </form>

        <!-- Step 2: 2FA Verification -->
        <div v-if="requires2FAVerification" class="flex flex-col space-y-4">
            <div class="text-sm text-center mb-2">
                <p class="font-medium mb-2">Two-Factor Authentication Required</p>
                <p class="text-muted-foreground">
                    Please enter the 6-digit verification code from your authenticator app to complete login.
                </p>
            </div>

            <VerificationCodeInput v-model:code="verificationCode" prefix="login-2fa" :disabled="isLoading" @submit="verifyTwoFactorCode" />

            <div class="flex space-x-2 mt-4">
                <Button variant="outline" class="flex-1" @click="cancelTwoFactorVerification" :disabled="isLoading"> Back </Button>
                <Button class="flex-1" @click="verifyTwoFactorCode" :disabled="isLoading || verificationCode.join('').length !== 6">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    <span v-else>Verify</span>
                </Button>
            </div>
        </div>

        <!-- SAML Login Option -->
        <div v-if="!requires2FAVerification" class="relative">
            <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
            </div>
        </div>
        <Button v-if="!requires2FAVerification" variant="outline" type="button" :disabled="isLoading" @click="handleSAMLLogin">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            <BriefcaseIcon v-else class="mr-2 h-4 w-4" />
            SAML
        </Button>
    </div>
</template>
