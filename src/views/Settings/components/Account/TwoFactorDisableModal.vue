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
});

const emit = defineEmits(['update:open', 'disable-complete']);

const userService = new UserService();

const disableVerificationCode = ref(['', '', '', '', '', '']);
const isDisableLoading = ref(false);

const confirmDisable2FA = async () => {
    const code = disableVerificationCode.value.join('');
    if (code.length !== 6) {
        toast({
            title: 'Invalid verification code',
            description: 'Please enter a 6-digit verification code.',
            variant: 'destructive',
        });
        return;
    }

    isDisableLoading.value = true;
    try {
        await userService.disable2FA(code);

        toast({
            title: 'Two-factor authentication disabled',
            description: 'Two-factor authentication has been disabled for your account.',
            variant: 'success',
        });

        emit('disable-complete', false, false);
    } catch (error) {
        resetVerificationCode(disableVerificationCode.value, 'disable-2fa-code');

        toast({
            title: 'Invalid verification code',
            description: 'The verification code you entered is incorrect. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isDisableLoading.value = false;
    }
};
</script>

<template>
    <Dialog :open="open" @update:open="emit('update:open', $event)">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            </DialogHeader>

            <div class="space-y-6">
                <div class="text-sm text-center">
                    <p class="font-medium mb-2 mt-4">Verification Required</p>
                    <p class="text-muted-foreground">
                        For security reasons, please enter the current 6-digit code from your authenticator app to disable 2FA.
                    </p>
                </div>

                <VerificationCodeInput
                    v-model:code="disableVerificationCode"
                    prefix="disable-2fa-code"
                    :disabled="isDisableLoading"
                    @submit="confirmDisable2FA"
                />
            </div>

            <DialogFooter>
                <Button variant="outline" @click="emit('update:open', false)" :disabled="isDisableLoading"> Cancel </Button>
                <Button
                    variant="destructive"
                    @click="confirmDisable2FA"
                    :disabled="isDisableLoading || disableVerificationCode.join('').length !== 6"
                >
                    <span v-if="isDisableLoading">Verifying...</span>
                    <span v-else>Disable 2FA</span>
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
