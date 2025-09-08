<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';

const props = defineProps<{
    show: boolean;
}>();
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-105"
        >
            <div
                v-if="show"
                class="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center"
                style="pointer-events: all"
            >
                <!-- Simple, Clean Loading -->
                <div class="flex flex-col items-center space-y-6 text-center">
                    <!-- Logo with Subtle Animation -->
                    <div class="relative">
                        <div class="w-16 h-16 p-3 bg-card rounded-2xl border shadow-lg">
                            <img src="@/assets/logos/logo-1.png" alt="Logo" class="w-full h-full object-contain" />
                        </div>
                    </div>

                    <!-- Loading Spinner & Text -->
                    <div class="flex items-center space-x-3">
                        <Loader2 class="h-5 w-5 animate-spin text-primary" />
                        <span class="text-lg font-medium text-foreground"> Signing you in... </span>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
    .animate-spin {
        animation: none;
    }

    * {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
    }
}
</style>
