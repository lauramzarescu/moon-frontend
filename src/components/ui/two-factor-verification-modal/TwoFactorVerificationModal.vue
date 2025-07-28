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
                <!-- Method Switching (only show if user has both methods available) -->
                <div v-if="canSwitchMethods" class="flex justify-center">
                    <div class="flex items-center gap-2 p-1 bg-muted rounded-lg">
                        <Button
                            :variant="!useYubikey ? 'default' : 'ghost'"
                            size="sm"
                            @click="switchToTotp"
                            class="h-8 px-3"
                        >
                            <SmartphoneIcon class="h-3 w-3 mr-1" />
                            Authenticator
                        </Button>
                        <Button
                            :variant="useYubikey ? 'default' : 'ghost'"
                            size="sm"
                            @click="switchToYubikey"
                            class="h-8 px-3"
                        >
                            <ShieldCheckIcon class="h-3 w-3 mr-1" />
                            YubiKey
                        </Button>
                    </div>
                </div>

                <!-- YubiKey Input -->
                <div v-if="useYubikey" class="space-y-2">
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

            <DialogFooter>
                <Button variant="outline" @click="handleCancel" :disabled="isLoading">
                    Cancel
                </Button>
                <Button
                    @click="handleVerify"
                    :disabled="isLoading || !isVerificationReady"
                >
                    <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    Verify
                </Button>
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
import { ShieldCheckIcon, SmartphoneIcon, AlertTriangleIcon, Loader2Icon } from 'lucide-vue-next';
import { TwoFactorMethod } from '@/enums/user/user.enum.ts';
import { resetVerificationCode } from '@/utils/twoFactorUtils.ts';
import VerificationCodeInput from '@/components/ui/verification-code-input/VerificationCodeInput.vue';

const props = defineProps<{
    open: boolean;
    title?: string;
    description?: string;
    twoFactorMethod: TwoFactorMethod | null;
    inputPrefix?: string;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    'verify': [code: string];
    'cancel': [];
}>();

const isOpen = ref(props.open);
const verificationCode = ref(['', '', '', '', '', '']);
const yubikeyOtp = ref('');
const useYubikey = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const inputPrefix = computed(() => props.inputPrefix || 'verification-2fa');

const canSwitchMethods = computed(() => {
    return props.twoFactorMethod === TwoFactorMethod.ANY;
});

const isVerificationReady = computed(() => {
    if (useYubikey.value) {
        return yubikeyOtp.value.length >= 32;
    } else {
        return verificationCode.value.join('').length === 6;
    }
});

watch(() => props.open, (newValue) => {
    isOpen.value = newValue;
    if (newValue) {
        resetForm();
        setInitialVerificationMethod();
    }
});

watch(isOpen, (newValue) => {
    emit('update:open', newValue);
});

const setInitialVerificationMethod = () => {
    switch (props.twoFactorMethod) {
        case TwoFactorMethod.YUBIKEY:
            useYubikey.value = true;
            break;
        case TwoFactorMethod.TOTP:
            useYubikey.value = false;
            break;
        case TwoFactorMethod.ANY:
            useYubikey.value = false; // Default to TOTP
            break;
        default:
            useYubikey.value = false;
    }
};

const switchToTotp = () => {
    useYubikey.value = false;
    yubikeyOtp.value = '';
    resetVerificationCode(verificationCode.value, inputPrefix.value);
    errorMessage.value = '';
};

const switchToYubikey = () => {
    useYubikey.value = true;
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

const resetForm = () => {
    verificationCode.value = ['', '', '', '', '', ''];
    yubikeyOtp.value = '';
    errorMessage.value = '';
    isLoading.value = false;
};

const handleVerify = () => {
    if (!isVerificationReady.value || isLoading.value) return;

    const code = useYubikey.value ? yubikeyOtp.value : verificationCode.value.join('');
    emit('verify', code);
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
