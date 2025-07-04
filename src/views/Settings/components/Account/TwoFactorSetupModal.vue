<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { UserService } from '@/services/user.service.ts';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { resetVerificationCode } from '@/utils/twoFactorUtils.ts';
import VerificationCodeInput from '@/components/ui/verification-code-input/VerificationCodeInput.vue';

const props = defineProps({
    open: {
        type: Boolean,
        required: true,
    },
    qrCodeUrl: {
        type: String,
        required: true,
    },
    isLoading: {
        type: Boolean,
        default: false,
    },
    // Used for verifying the code entered by the user after the QR code has been scanned on login
    verifySession: {
        type: Boolean,
        required: false,
    },
    sessionToken: {
        type: String,
        required: false,
    },
});

const emit = defineEmits(['update:open', 'setup-complete']);

const userService = new UserService();
const verificationCode = ref(['', '', '', '', '', '']);
const localIsLoading = ref(false);

const verify2FACode = async () => {
    const code = verificationCode.value.join('');
    if (code.length !== 6) {
        verificationCode.value = ['', '', '', '', '', ''];
        toast({
            title: 'Invalid verification code',
            description: 'Please enter a 6-digit verification code.',
            variant: 'destructive',
        });
        return;
    }

    localIsLoading.value = true;
    try {
        props.verifySession ? await userService.verify2FASession(code, props.sessionToken) : await userService.verify2FACode(code);

        toast({
            title: 'Two-factor authentication enabled',
            description: 'Your account is now protected with 2FA.',
            variant: 'success',
        });

        emit('setup-complete', true, true);
    } catch (error) {
        resetVerificationCode(verificationCode.value, '2fa-code');

        toast({
            title: 'Invalid verification code',
            description: 'The verification code you entered is incorrect. Please try again.',
            variant: 'destructive',
        });
    } finally {
        localIsLoading.value = false;
    }
};

const handleOpenChange = (open: boolean) => {
    if (!open && !props.isLoading && !localIsLoading.value) {
        emit('update:open', false);
    }
};

const handleContentClick = (event: Event) => {
    event.stopPropagation();
};
</script>

<template>
    <Dialog :open="open" @update:open="handleOpenChange">
        <DialogContent
            class="sm:max-w-md dialog-no-close-on-outside-click"
            @click="handleContentClick"
            @pointer-down-outside.prevent
            @interact-outside.prevent
        >
            <DialogHeader>
                <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            </DialogHeader>

            <div class="space-y-6">
                <div v-if="qrCodeUrl" class="flex justify-center py-4">
                    <img :src="qrCodeUrl" alt="2FA QR Code" class="h-48 w-48" />
                </div>
                <div v-else class="flex justify-center py-4 text-red-500">QR code not available. Please try again.</div>
                <div class="text-sm text-center">
                    <p class="font-medium mb-2">Scan the QR code with your authenticator app</p>
                    <p class="text-foreground">
                        Use an app like Google Authenticator, Authy, or Microsoft Authenticator to scan this QR code.
                    </p>
                </div>

                <VerificationCodeInput
                    v-model:code="verificationCode"
                    prefix="2fa-code"
                    :disabled="isLoading || localIsLoading"
                    @submit="verify2FACode"
                />
            </div>

            <DialogFooter>
                <Button variant="outline" @click="handleOpenChange(false)" :disabled="isLoading || localIsLoading"> Cancel </Button>
                <Button @click="verify2FACode" :disabled="isLoading || localIsLoading || verificationCode.join('').length !== 6">
                    <span v-if="isLoading || localIsLoading">Verifying...</span>
                    <span v-else>Verify</span>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
:deep([data-radix-dialog-overlay]) {
    background-color: rgba(0, 0, 0, 0.4) !important;
}

:deep(.dialog-no-close-on-outside-click) {
    pointer-events: auto;
}

:deep([data-radix-dialog-overlay][data-state='open']) {
    pointer-events: auto;
}
</style>
