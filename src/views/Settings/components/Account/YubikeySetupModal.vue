<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <ShieldCheckIcon class="h-5 w-5 text-primary" />
                    Set Up YubiKey
                </DialogTitle>
                <DialogDescription> Add a YubiKey to your account for enhanced security </DialogDescription>
            </DialogHeader>

            <div class="space-y-4">
                <!-- Instructions -->
                <div class="p-4 bg-card border rounded-lg">
                    <div class="flex items-start gap-2">
                        <InfoIcon class="h-4 w-4 text-primary mt-0.5" />
                        <div class="text-sm">
                            <p class="font-medium mb-1">How to set up your YubiKey:</p>
                            <ol class="text-muted-foreground space-y-1 list-decimal list-inside">
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
                    <p class="text-xs text-muted-foreground">Give your YubiKey a memorable name</p>
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
                    <p class="text-xs text-muted-foreground">The OTP should be 32-48 characters long</p>
                </div>

                <!-- Error Message -->
                <div v-if="errorMessage" class="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div class="flex items-center gap-2">
                        <AlertTriangleIcon class="h-4 w-4 text-destructive" />
                        <span class="text-sm text-destructive">{{ errorMessage }}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="handleClose" :disabled="isLoading"> Cancel </Button>
                <Button @click="handleSetup" :disabled="!otpValue || isLoading || otpValue.length < 32">
                    <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    Add YubiKey
                </Button>
            </DialogFooter>

            <!-- Global Loading Overlay -->
            <div
                v-if="isLoading || successMessage"
                class="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
                <div class="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 shadow-lg">
                    <div
                        v-if="!successMessage"
                        class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                    ></div>
                    <CheckCircleIcon v-else class="h-5 w-5 text-green-600" />
                    <span class="text-sm font-medium">
                        {{ successMessage || 'Setting up YubiKey...' }}
                    </span>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, Loader2Icon, ShieldCheckIcon } from 'lucide-vue-next';
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

watch(
    () => props.open,
    (newValue) => {
        isOpen.value = newValue;
        if (newValue) {
            // Reset form when opening
            otpValue.value = '';
            nicknameValue.value = '';
            errorMessage.value = '';
            successMessage.value = '';
        }
    },
);

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
            nickname: nicknameValue.value.trim() || undefined,
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
