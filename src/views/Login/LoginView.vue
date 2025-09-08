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

            <!-- Enhanced Animated Background Pattern -->
            <div class="absolute inset-0 opacity-10">
                <!-- Primary floating elements -->
                <div class="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full blur-xl animate-float-slow"></div>
                <div
                    class="absolute bottom-32 right-16 w-24 h-24 bg-accent rounded-full blur-lg animate-float-medium"
                    style="animation-delay: 1s"
                ></div>
                <div
                    class="absolute top-1/2 left-1/3 w-16 h-16 bg-primary/50 rounded-full blur-md animate-float-fast"
                    style="animation-delay: 2s"
                ></div>

                <!-- Additional geometric shapes -->
                <div
                    class="absolute top-1/4 right-1/4 w-20 h-20 bg-gradient-to-br from-primary/30 to-accent/30 rounded-lg blur-lg animate-rotate-slow"
                    style="animation-delay: 0.5s"
                ></div>
                <div
                    class="absolute bottom-1/4 left-1/4 w-12 h-12 bg-primary/40 rounded-full blur-sm animate-scale-pulse"
                    style="animation-delay: 1.5s"
                ></div>
                <div
                    class="absolute top-3/4 right-1/3 w-8 h-8 bg-accent/60 rounded-full blur-sm animate-float-fast"
                    style="animation-delay: 3s"
                ></div>

                <!-- Particle-like elements -->
                <div
                    class="absolute top-1/3 left-1/2 w-4 h-4 bg-primary/70 rounded-full blur-xs animate-drift-horizontal"
                    style="animation-delay: 2.5s"
                ></div>
                <div
                    class="absolute bottom-1/3 right-1/2 w-6 h-6 bg-accent/50 rounded-full blur-xs animate-drift-vertical"
                    style="animation-delay: 4s"
                ></div>

                <!-- Moving gradient orbs -->
                <div
                    class="absolute top-1/6 left-1/6 w-28 h-28 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-2xl animate-orbit"
                    style="animation-delay: 1s"
                ></div>
                <div
                    class="absolute bottom-1/6 right-1/6 w-36 h-36 bg-gradient-to-l from-accent/15 to-transparent rounded-full blur-3xl animate-orbit-reverse"
                    style="animation-delay: 2.5s"
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
                            <img src="@/assets/logos/logo-4.png" alt="Logo" class="w-full h-full object-contain filter drop-shadow-lg" />
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
                                <img src="@/assets/logos/logo-4.png" alt="Logo" class="w-full h-full object-contain" />
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
/* Enhanced floating animations with different speeds */
@keyframes float-slow {
    0%,
    100% {
        transform: translateY(0px) scale(1);
    }
    50% {
        transform: translateY(-15px) scale(1.05);
    }
}

@keyframes float-medium {
    0%,
    100% {
        transform: translateY(0px) rotate(0deg);
    }
    50% {
        transform: translateY(-12px) rotate(5deg);
    }
}

@keyframes float-fast {
    0%,
    100% {
        transform: translateY(0px) translateX(0px);
    }
    25% {
        transform: translateY(-8px) translateX(3px);
    }
    75% {
        transform: translateY(-8px) translateX(-3px);
    }
}

/* Rotation animations */
@keyframes rotate-slow {
    0% {
        transform: rotate(0deg) scale(1);
    }
    50% {
        transform: rotate(180deg) scale(1.1);
    }
    100% {
        transform: rotate(360deg) scale(1);
    }
}

/* Scale pulse animation */
@keyframes scale-pulse {
    0%,
    100% {
        transform: scale(1) opacity(0.7);
    }
    50% {
        transform: scale(1.3) opacity(1);
    }
}

/* Drift animations */
@keyframes drift-horizontal {
    0%,
    100% {
        transform: translateX(0px) translateY(0px);
    }
    25% {
        transform: translateX(20px) translateY(-5px);
    }
    50% {
        transform: translateX(0px) translateY(-10px);
    }
    75% {
        transform: translateX(-20px) translateY(-5px);
    }
}

@keyframes drift-vertical {
    0%,
    100% {
        transform: translateY(0px) translateX(0px);
    }
    25% {
        transform: translateY(-15px) translateX(5px);
    }
    50% {
        transform: translateY(0px) translateX(10px);
    }
    75% {
        transform: translateY(15px) translateX(5px);
    }
}

/* Orbital animations */
@keyframes orbit {
    0% {
        transform: rotate(0deg) translateX(30px) rotate(0deg);
    }
    100% {
        transform: rotate(360deg) translateX(30px) rotate(-360deg);
    }
}

@keyframes orbit-reverse {
    0% {
        transform: rotate(0deg) translateX(-40px) rotate(0deg);
    }
    100% {
        transform: rotate(-360deg) translateX(-40px) rotate(360deg);
    }
}

/* Apply animations */
.animate-float-slow {
    animation: float-slow 8s ease-in-out infinite;
}
.animate-float-medium {
    animation: float-medium 6s ease-in-out infinite;
}
.animate-float-fast {
    animation: float-fast 4s ease-in-out infinite;
}
.animate-rotate-slow {
    animation: rotate-slow 12s linear infinite;
}
.animate-scale-pulse {
    animation: scale-pulse 3s ease-in-out infinite;
}
.animate-drift-horizontal {
    animation: drift-horizontal 10s ease-in-out infinite;
}
.animate-drift-vertical {
    animation: drift-vertical 8s ease-in-out infinite;
}
.animate-orbit {
    animation: orbit 20s linear infinite;
}
.animate-orbit-reverse {
    animation: orbit-reverse 25s linear infinite;
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
    .animate-float-slow,
    .animate-float-medium,
    .animate-float-fast,
    .animate-rotate-slow,
    .animate-scale-pulse,
    .animate-drift-horizontal,
    .animate-drift-vertical,
    .animate-orbit,
    .animate-orbit-reverse {
        animation: none;
    }

    * {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
    }
}

/* Additional blur utilities */
.blur-xs {
    filter: blur(2px);
}
.blur-2xl {
    filter: blur(40px);
}
.blur-3xl {
    filter: blur(64px);
}
</style>
