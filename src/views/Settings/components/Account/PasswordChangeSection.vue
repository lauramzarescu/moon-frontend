<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { UserService } from '@/services/user.service.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import * as z from 'zod';
import { toTypedSchema } from '@vee-validate/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { resetVerificationCode } from '@/utils/twoFactorUtils.ts';
import VerificationCodeInput from '@/components/ui/verification-code-input/VerificationCodeInput.vue';
import { LoginType } from '@/enums/user/user.enum.ts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-vue-next';
import { changePasswordSchema, changePasswordWith2FASchema } from '@/views/Settings/components/Team/schema.ts';

const showPasswordModal = ref(false);
const step = ref(1); // 1: Password form, 2: 2FA verification (if enabled)
const isLoading = ref(false);
const verificationCode = ref(['', '', '', '', '', '']);

// Store form values between steps
const formValues = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
});

// Initialize services and stores
const userService = new UserService();
const authStore = useAuthStore();

// Computed properties
const is2FAEnabled = computed(() => authStore.user?.twoFactorVerified || false);
const isSamlUser = computed(() => authStore.user?.loginType === LoginType.saml);

const passwordFormSchema = toTypedSchema(
    z
        .object({
            currentPassword: z.string().min(1, 'Current password is required'),
            newPassword: z
                .string()
                .min(8, 'Password must be at least 8 characters')
                .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .regex(/[0-9]/, 'Password must contain at least one number'),
            confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
            message: "Passwords don't match",
            path: ['confirmPassword'],
        }),
);

async function onPasswordSubmit(values: any) {
    formValues.value = { ...values };

    isLoading.value = true;

    try {
        if (is2FAEnabled.value) {
            step.value = 2;
        } else {
            const data = changePasswordSchema.parse(values);
            await userService.changePassword(data);

            toast({
                title: 'Password changed successfully',
                description: 'Your password has been updated.',
            });

            resetForm();
        }
    } catch (error) {
        toast({
            title: 'Error changing password',
            description: 'The current password you entered is incorrect.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
}

// Handle 2FA verification and password change
const confirmWithTwoFactor = async () => {
    if (verificationCode.value.join('').length !== 6) return;

    isLoading.value = true;

    try {
        const code = verificationCode.value.join('');
        const data = changePasswordWith2FASchema.parse({
            ...formValues.value,
            code,
        });
        await userService.changePasswordWith2FA(data);

        toast({
            title: 'Password changed successfully',
            description: 'Your password has been updated.',
        });

        resetForm();
    } catch (error: any) {
        resetVerificationCode(verificationCode.value, 'change-password-2fa');

        toast({
            title: 'Verification failed',
            description: 'The verification code you entered is incorrect. Please try again.',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};

const resetForm = () => {
    showPasswordModal.value = false;
    step.value = 1;
    verificationCode.value = ['', '', '', '', '', ''];
    formValues.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    isLoading.value = false;
};

const handleDialogClose = () => {
    if (!isLoading.value) {
        resetForm();
    }
};
</script>

<template>
    <div>
        <!-- SAML User Warning -->
        <Alert v-if="isSamlUser" variant="warning" class="mb-4">
            <InfoIcon class="h-4 w-4" />
            <AlertTitle>SAML Authentication</AlertTitle>
            <AlertDescription>
                Password change and two-factor authentication are disabled for SAML users. Please contact your organization administrator to
                manage your authentication settings.
            </AlertDescription>
        </Alert>

        <div class="flex items-center justify-between space-y-4">
            <div>
                <h4 class="text-sm font-medium">Password</h4>
                <p class="text-sm text-foreground">Update your account password</p>
            </div>
            <Button variant="outline" @click="showPasswordModal = true" :disabled="isSamlUser"> Change Password</Button>
        </div>

        <!-- Password Change Modal -->
        <Dialog v-model:open="showPasswordModal" @update:open="handleDialogClose">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>

                <!-- Password Form (Step 1) -->
                <div v-if="step === 1">
                    <Form :validation-schema="passwordFormSchema" class="space-y-4" @submit="onPasswordSubmit">
                        <FormField v-slot="{ componentField }" name="currentPassword">
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Enter current password"
                                        v-bind="componentField"
                                        :disabled="isLoading"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField v-slot="{ componentField }" name="newPassword">
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Enter new password" v-bind="componentField" :disabled="isLoading" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <FormField v-slot="{ componentField }" name="confirmPassword">
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Confirm new password"
                                        v-bind="componentField"
                                        :disabled="isLoading"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                @click="showPasswordModal = false"
                                @keydown.esc="showPasswordModal = false"
                                :disabled="isLoading"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" :disabled="isLoading" @keydown.enter="onPasswordSubmit(formValues)">
                                <span v-if="isLoading">Processing...</span>
                                <span v-else>{{ is2FAEnabled ? 'Continue' : 'Change Password' }}</span>
                            </Button>
                        </DialogFooter>
                    </Form>
                </div>

                <!-- 2FA Verification (Step 2) -->
                <div v-if="step === 2" class="space-y-6">
                    <div class="text-sm text-center">
                        <p class="font-medium mb-2">Two-Factor Authentication Required</p>
                        <p class="text-foreground">
                            For security reasons, please enter the current 6-digit code from your authenticator app to change your password.
                        </p>
                    </div>

                    <VerificationCodeInput v-model:code="verificationCode" prefix="change-password-2fa" :disabled="isLoading" />

                    <DialogFooter>
                        <Button variant="outline" @click="step = 1" @keydown.esc="step = 1" :disabled="isLoading"> Back </Button>

                        <Button
                            @click="confirmWithTwoFactor"
                            @keydown.enter="confirmWithTwoFactor"
                            :disabled="isLoading || verificationCode.join('').length !== 6"
                        >
                            <span v-if="isLoading">Verifying...</span>
                            <span v-else>Change Password</span>
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
