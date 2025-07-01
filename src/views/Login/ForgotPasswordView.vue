<template>
    <div class="text-center space-y-2 mb-8">
        <h1 class="text-3xl font-bold tracking-tight">Forgot Password</h1>
        <p class="text-sm text-muted-foreground">Enter your email address and we'll send you a reset link</p>
    </div>

    <div class="space-y-6">
        <form @submit.prevent="handleSubmit">
            <div class="grid gap-2">
                <div class="grid gap-1">
                    <Label class="sr-only" for="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        v-model="email"
                        placeholder="name@example.com"
                        auto-capitalize="none"
                        auto-complete="email"
                        auto-correct="off"
                        :disabled="isLoading"
                        @keyup.enter="handleSubmit"
                    />
                    <span v-if="errors.email" class="text-sm text-destructive">
                        {{ errors.email }}
                    </span>
                </div>

                <Button type="submit" :disabled="isLoading || !email" class="mt-2">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
                </Button>

                <Button variant="outline" type="button" @click="backToLogin" :disabled="isLoading" class="mt-2"> Back to Login </Button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-vue-next';
import { UserService } from '@/services/user.service';
import { forgotPasswordSchema } from '@/views/Settings/components/Team/schema';
import { toast } from '@/components/ui/toast';

const router = useRouter();
const userService = new UserService();

const email = ref('');
const isLoading = ref(false);
const errors = ref<Record<string, string>>({});
const successMessage = ref('');
const errorMessage = ref('');

const handleSubmit = async () => {
    // Clear previous errors and messages
    errors.value = {};
    errorMessage.value = '';
    successMessage.value = '';

    try {
        // Validate input
        const validatedData = forgotPasswordSchema.parse({
            email: email.value,
        });

        isLoading.value = true;

        await userService.forgotPassword(validatedData);

        successMessage.value =
            'Password reset link has been sent to your email address. Please check your inbox and follow the instructions.';

        toast({
            title: 'Success',
            description: 'Password reset link has been sent to your email address. Please check your inbox and follow the instructions.',
            variant: 'success',
        });

        // Optionally redirect back to login after a delay
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
            errorMessage.value = error.message || 'Failed to send reset email. Please try again.';
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
