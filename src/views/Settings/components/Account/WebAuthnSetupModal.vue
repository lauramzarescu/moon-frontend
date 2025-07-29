<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle class="flex items-center gap-2">
                    <ShieldCheckIcon class="h-5 w-5 text-green-600" />
                    Set Up WebAuthn Security Key
                </DialogTitle>
                <DialogDescription>
                    Add a WebAuthn-compatible security key with PIN protection for enhanced security
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-4">
                <!-- Instructions -->
                <div class="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
                    <div class="flex items-start gap-2">
                        <InfoIcon class="h-4 w-4 text-green-600 mt-0.5" />
                        <div class="text-sm">
                            <p class="font-medium text-green-800 dark:text-green-200 mb-1">How to set up your WebAuthn key:</p>
                            <ol class="text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
                                <li>Insert your security key into a USB port</li>
                                <li>Click "Register Security Key" below</li>
                                <li>Follow your browser's prompts</li>
                                <li>Enter your security key's PIN when prompted</li>
                                <li>Touch the key when it lights up</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <!-- Browser Support Check -->
                <div v-if="!browserSupported" class="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-950 dark:border-red-800">
                    <div class="flex items-center gap-2">
                        <AlertTriangleIcon class="h-4 w-4 text-red-600" />
                        <span class="text-sm text-red-700 dark:text-red-300">
                            Your browser doesn't support WebAuthn. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
                        </span>
                    </div>
                </div>

                <!-- Nickname Input -->
                <div class="space-y-2">
                    <Label for="webauthn-nickname">Nickname (Optional)</Label>
                    <Input
                        id="webauthn-nickname"
                        v-model="nicknameValue"
                        placeholder="e.g., Work Security Key, Personal Key..."
                        :disabled="isLoading || !browserSupported"
                        @keydown.enter="handleSetup"
                    />
                    <p class="text-xs text-muted-foreground">
                        Give your security key a memorable name
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
                <Button @click="handleSetup" :disabled="isLoading || !browserSupported">
                    <Loader2Icon v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
                    Register Security Key
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheckIcon, InfoIcon, AlertTriangleIcon, CheckCircleIcon, Loader2Icon } from 'lucide-vue-next';
import { UserService } from '@/services/user.service.ts';
import { webauthnRegistrationStartSchema, webauthnRegistrationCompleteSchema } from '@/views/Settings/components/Team/schema.ts';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';

const props = defineProps<{
    open: boolean;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    'setup-complete': [success: boolean];
}>();

const userService = new UserService();

const isOpen = ref(props.open);
const nicknameValue = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const browserSupported = ref(false);
const challengeId = ref('');

onMounted(() => {
    browserSupported.value = browserSupportsWebAuthn();
});

watch(() => props.open, (newValue) => {
    isOpen.value = newValue;
    if (newValue) {
        // Reset form when opening
        nicknameValue.value = '';
        errorMessage.value = '';
        successMessage.value = '';
        challengeId.value = '';
    }
});

watch(isOpen, (newValue) => {
    emit('update:open', newValue);
});

const handleClose = () => {
    isOpen.value = false;
};

const handleSetup = async () => {
    if (!browserSupported.value) {
        errorMessage.value = 'WebAuthn is not supported in your browser';
        return;
    }

    try {
        isLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';

        // Validate the nickname
        const startData = webauthnRegistrationStartSchema.parse({
            nickname: nicknameValue.value.trim() || undefined
        });

        // Start WebAuthn registration
        console.log('Starting WebAuthn registration with data:', startData);
        const registrationResponse = await userService.startWebAuthnRegistration(startData);
        console.log('Received registration response:', registrationResponse);

        // Store the challengeId for completion
        challengeId.value = registrationResponse.challengeId;

        // Use SimpleWebAuthn to handle the browser WebAuthn API
        const credential = await startRegistration({ optionsJSON: registrationResponse });
        console.log('WebAuthn credential created:', credential);

        // Complete registration with challengeId
        const completeData = webauthnRegistrationCompleteSchema.parse({
            credential,
            challengeId: challengeId.value,
            nickname: nicknameValue.value.trim() || undefined
        });
        console.log('Completing registration with data:', completeData);

        const result = await userService.completeWebAuthnRegistration(completeData);
        console.log('Registration completed successfully:', result);

        successMessage.value = 'WebAuthn security key registered successfully!';

        setTimeout(() => {
            emit('setup-complete', true);
            handleClose();
        }, 1500);

    } catch (error: any) {
        console.error('WebAuthn setup error:', error);
        
        if (error.name === 'InvalidStateError') {
            errorMessage.value = 'This security key is already registered. Please try a different key.';
        } else if (error.name === 'NotAllowedError') {
            errorMessage.value = 'Registration was cancelled or timed out. Please try again.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage.value = 'Your security key is not supported. Please try a different key.';
        } else if (error.name === 'SecurityError') {
            errorMessage.value = 'Security error occurred. Please ensure you\'re using HTTPS.';
        } else if (error.errors && error.errors.length > 0) {
            errorMessage.value = error.errors[0].message;
        } else if (error.message) {
            errorMessage.value = error.message;
        } else {
            errorMessage.value = 'Failed to register security key. Please try again.';
        }
    } finally {
        isLoading.value = false;
    }
};
</script>
