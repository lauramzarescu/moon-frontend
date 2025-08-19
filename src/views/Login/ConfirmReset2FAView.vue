<template>
    <div class="text-center space-y-2 mb-8">
        <h1 class="text-3xl font-bold tracking-tight">Reset Two-Factor Authentication</h1>
        <p class="text-sm text-muted-foreground">Click the button below to confirm the reset of your two-factor authentication</p>
    </div>

    <div class="space-y-6">
        <form @submit.prevent="handleSubmit">
            <div class="grid gap-2">
                <Button type="submit" :disabled="isLoading || !resetToken" class="mt-2">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    {{ isLoading ? 'Confirming...' : 'Confirm 2FA Reset' }}
                </Button>

                <Button variant="outline" type="button" @click="backToLogin" :disabled="isLoading" class="mt-2"> Back to Login </Button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-vue-next';
import { UserService } from '@/services/user.service';
import { toast } from '@/components/ui/toast';

const router = useRouter();
const route = useRoute();
const userService = new UserService();

const resetToken = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

onMounted(() => {
    const token = route.query.token as string;

    if (!token) {
        toast({
            title: 'Invalid Reset Link',
            description: 'No reset token found. Please request a new 2FA reset link.',
            variant: 'destructive',
        });
        router.push('/login');
        return;
    }

    resetToken.value = token;
});

const handleSubmit = async () => {
    errorMessage.value = '';
    successMessage.value = '';

    if (!resetToken.value) {
        toast({
            title: 'Invalid Token',
            description: 'No valid reset token found.',
            variant: 'destructive',
        });
        return;
    }

    try {
        isLoading.value = true;

        await userService.confirmReset2FA(resetToken.value);

        successMessage.value =
            'Two-factor authentication has been reset successfully. You can now set up 2FA again in your profile settings.';

        toast({
            title: '2FA Reset Successful',
            description:
                'Your two-factor authentication has been reset successfully. You can now set up 2FA again in your profile settings.',
            variant: 'success',
        });

        // Redirect to login after a delay
        setTimeout(() => {
            router.push('/login');
        }, 500);
    } catch (error: any) {
        errorMessage.value = error.message || 'Failed to reset 2FA. Please try again or contact support.';

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
