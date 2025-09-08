<script setup lang="ts">
import UserAuthForm from '@/views/Login/components/UserAuthForm.vue';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { onMounted, ref } from 'vue';

const isLoaded = ref(false);

onMounted(() => {
    // Trigger animations after component mounts
    setTimeout(() => {
        isLoaded.value = true;
    }, 100);
});
</script>

<template>
    <div class="min-h-screen w-screen flex overflow-hidden">
        <!-- Left Side - Branding -->
        <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-shrink-0">
            <!-- Gradient Background -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/30 to-primary/10"></div>

            <!-- Animated Background Pattern -->
            <div class="absolute inset-0 opacity-10">
                <div class="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full blur-xl animate-pulse"></div>
                <div
                    class="absolute bottom-32 right-16 w-24 h-24 bg-accent rounded-full blur-lg animate-pulse"
                    style="animation-delay: 1s"
                ></div>
                <div
                    class="absolute top-1/2 left-1/3 w-16 h-16 bg-primary/50 rounded-full blur-md animate-pulse"
                    style="animation-delay: 2s"
                ></div>
            </div>

            <!-- Content -->
            <div class="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
                <div
                    class="transition-all duration-1000 ease-out transform"
                    :class="isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
                >
                    <!-- Logo -->
                    <div class="mb-8 flex justify-center">
                        <div
                            class="w-24 h-24 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:scale-105 transition-transform duration-300"
                        >
                            <img src="@/assets/logos/logo-1.png" alt="Logo" class="w-full h-full object-contain filter drop-shadow-lg" />
                        </div>
                    </div>

                    <!-- Welcome Text -->
                    <h1 class="text-4xl font-bold text-foreground mb-4 tracking-tight">Welcome Back</h1>
                    <p class="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
                        Sign in to your account to access your dashboard and manage your services.
                    </p>
                </div>
            </div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background flex-shrink-0">
            <div class="w-full max-w-md">
                <Card
                    class="transition-all duration-1000 ease-out transform shadow-xl border-0 bg-card/50 backdrop-blur-sm"
                    :class="isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'"
                >
                    <CardHeader class="space-y-4 text-center pb-6">
                        <!-- Mobile Logo -->
                        <div class="lg:hidden flex justify-center mb-4">
                            <div class="w-16 h-16 p-3 bg-primary/10 rounded-xl border border-primary/20">
                                <img src="@/assets/logos/logo-1.png" alt="Logo" class="w-full h-full object-contain" />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <h1 class="text-2xl font-semibold tracking-tight text-foreground">Sign In</h1>
                            <p class="text-sm text-muted-foreground">Enter your credentials below to access your account</p>
                        </div>
                    </CardHeader>

                    <CardContent class="pt-0">
                        <UserAuthForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes float {
    0%,
    100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
}

.animate-float {
    animation: float 6s ease-in-out infinite;
}
</style>
