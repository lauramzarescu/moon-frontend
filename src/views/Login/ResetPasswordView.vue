<template>
    <div class="text-center space-y-2 mb-8">
        <h1 class="text-3xl font-bold tracking-tight">Reset Password</h1>
        <p class="text-sm text-muted-foreground">Enter your new password</p>
    </div>

    <div class="space-y-6">
        <form @submit.prevent="handleSubmit">
            <div class="grid gap-2">
                <div class="grid gap-1">
                    <Label class="sr-only" for="password">New Password</Label>
                    <Input
                        id="password"
                        type="password"
                        v-model="newPassword"
                        placeholder="Enter your new password"
                        auto-capitalize="none"
                        auto-complete="new-password"
                        auto-correct="off"
                        :disabled="isLoading"
                    />
                    <span v-if="errors.newPassword" class="text-sm text-destructive">
                        {{ errors.newPassword }}
                    </span>
                </div>

                <div class="grid gap-1">
                    <Label class="sr-only" for="confirmPassword">Confirm New Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        v-model="confirmPassword"
                        placeholder="Confirm your new password"
                        auto-capitalize="none"
                        auto-complete="new-password"
                        auto-correct="off"
                        :disabled="isLoading"
                        @keyup.enter="handleSubmit"
                        class="mt-1"
                    />
                    <span v-if="errors.confirmPassword" class="text-sm text-destructive">
                        {{ errors.confirmPassword }}
                    </span>
                </div>

                <Button type="submit" :disabled="isLoading || !isFormValid" class="mt-2">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    {{ isLoading ? 'Resetting...' : 'Reset Password' }}
                </Button>

                <Button variant="outline" type="button" @click="backToLogin" :disabled="isLoading" class="mt-2"> Back to Login </Button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-vue-next';
import { UserService } from '@/services/user.service';
import { resetPasswordSchema } from '@/views/Settings/components/Team/schema';
import { toast } from '@/components/ui/toast';

const router = useRouter();
const route = useRoute();
const userService = new UserService();

const resetToken = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errors = ref<Record<string, string>>({});
const successMessage = ref('');
const errorMessage = ref('');

const isFormValid = computed(() => {
    return newPassword.value && confirmPassword.value;
});

// Check if we have a reset token in the URL on mount
onMounted(() => {
    const token = route.query.token as string;
    console.log('Reset token from URL:', token);
    if (!token) {
        // No token in URL, show error toast and redirect to login
        toast({
            title: 'Invalid Reset Link',
            description: 'No reset token found. Please request a new password reset link.',
            variant: 'destructive',
        });
        router.push('/login');
        return;
    }

    resetToken.value = token;
    console.log('Reset token loaded from URL:', token);
});

const handleSubmit = async () => {
    // Clear previous errors and messages
    errors.value = {};
    errorMessage.value = '';
    successMessage.value = '';

    // Client-side validation for password confirmation
    if (newPassword.value !== confirmPassword.value) {
        errors.value.confirmPassword = 'Passwords do not match';
        return;
    }

    try {
        // Validate input
        const validatedData = resetPasswordSchema.parse({
            token: resetToken.value,
            newPassword: newPassword.value,
        });

        isLoading.value = true;

        await userService.resetPassword(validatedData);

        successMessage.value = 'Password has been reset successfully. You can now login with your new password.';

        toast({
            title: 'Password Reset Successful',
            description: 'Your password has been reset successfully. You can now login with your new password.',
            variant: 'success',
        });

        // Redirect to login after a delay
        setTimeout(() => {
            router.push('/login');
        }, 500);
    } catch (error: any) {
        if (error.errors) {
            // Zod validation errors
            error.errors.forEach((err: any) => {
                errors.value[err.path[0]] = err.message;
            });
        } else {
            // API errors
            errorMessage.value = error.message || 'Failed to reset password. Please try again.';
        }

        toast({
            title: 'Error',
            description: errorMessage.value,
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};

const backToLogin = () => {
    router.push('/login');
};
</script>
