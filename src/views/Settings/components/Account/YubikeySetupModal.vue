<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <ShieldCheckIcon class="h-5 w-5 text-blue-600" />
                    Set Up YubiKey
                </DialogTitle>
                <DialogDescription>
                    Add a YubiKey to your account for enhanced security
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-4">
                <!-- Instructions -->
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                    <div class="flex items-start gap-2">
                        <InfoIcon class="h-4 w-4 text-blue-600 mt-0.5" />
                        <div class="text-sm">
                            <p class="font-medium text-blue-800 dark:text-blue-200 mb-1">How to set up your YubiKey:</p>
                            <ol class="text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                                <li>Insert your YubiKey into a USB port</li>
                                <li>Click in the input field below</li>
                                <li>Touch the gold contact on your YubiKey</li>
                                <li>The OTP will be automatically entered</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <!-- Nickname Input -->
                <div class="space-y-2">
                    <Label for="yubikey-nickname">Nickname (Optional)</Label>
                    <Input
                        id="yubikey-nickname"
                        v-model="nicknameValue"
                        placeholder="e.g., Work YubiKey, Personal Key..."
                        :disabled="isLoading"
                        @keydown.enter="handleSetup"
                    />
                    <p class="text-xs text-muted-foreground">
                        Give your YubiKey a memorable name
                    </p>
                </div>

                <!-- YubiKey OTP Input -->
                <div class="space-y-2">
                    <Label for="yubikey-otp">YubiKey OTP</Label>
                    <Input
                        id="yubikey-otp"
                        v-model="otpValue"
                        placeholder="Touch your YubiKey to generate OTP..."
                        :disabled="isLoading"
                        class="font-mono"
                        @keydown.enter="handleSetup"
                    />
                    <p class="text-xs text-muted-foreground">
                        The OTP should be 32-48 characters long
                    </p>
                </div>

                <!-- Error Message -->
                <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800">
                    <div class="flex items-center gap-2">
                        <AlertTriangleIcon class="h-4 w-4 text-red-600" />
                        <span class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</span>
                    </div>
                </div>

                <!-- Success Message -->
                <div v-if="successMessage" class="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-950 dark:border-green-800">
                    <div class="flex items-center gap-2">
                        <CheckCircleIcon class="h-4 w-4 text-green-600" />
                        <span class="text-sm text-green-700 dark:text-green-300">{{ successMessage }}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="handleClose" :disabled="isLoading">
                    Cancel
                </Button>
                <Button @click="handleSetup" :disabled="!otpValue || isLoading || otpValue.length < 32">
                    <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    Add YubiKey
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheckIcon, InfoIcon, AlertTriangleIcon, CheckCircleIcon, Loader2Icon } from 'lucide-vue-next';
import { UserService } from '@/services/user.service.ts';
import { yubikeySetupSchema } from '@/views/Settings/components/Team/schema.ts';

const props = defineProps<{
    open: boolean;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    'setup-complete': [success: boolean];
}>();

const userService = new UserService();

const isOpen = ref(props.open);
const otpValue = ref('');
const nicknameValue = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

watch(() => props.open, (newValue) => {
    isOpen.value = newValue;
    if (newValue) {
        // Reset form when opening
        otpValue.value = '';
        nicknameValue.value = '';
        errorMessage.value = '';
        successMessage.value = '';
    }
});

watch(isOpen, (newValue) => {
    emit('update:open', newValue);
});

const handleClose = () => {
    isOpen.value = false;
};

const handleSetup = async () => {
    if (!otpValue.value || otpValue.value.length < 32) {
        errorMessage.value = 'Please provide a valid YubiKey OTP';
        return;
    }

    try {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';

        // Validate the OTP format and nickname
        const validatedData = yubikeySetupSchema.parse({
            otp: otpValue.value,
            nickname: nicknameValue.value.trim() || undefined
        });

        await userService.setupYubikey(validatedData);

        successMessage.value = 'YubiKey added successfully!';

        setTimeout(() => {
            emit('setup-complete', true);
            handleClose();
        }, 1500);

    } catch (error: any) {
        console.error('YubiKey setup error:', error);
        if (error.errors && error.errors.length > 0) {
            errorMessage.value = error.errors[0].message;
        } else if (error.message) {
            errorMessage.value = error.message;
        } else {
            errorMessage.value = 'Failed to set up YubiKey. Please try again.';
        }
    } finally {
        isLoading.value = false;
    }
};
</script>
