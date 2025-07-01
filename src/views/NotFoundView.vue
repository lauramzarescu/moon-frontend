<template>
    <div class="min-h-screen flex items-center justify-center bg-background">
        <div class="text-center space-y-6 max-w-md mx-auto px-4">
            <div class="space-y-2">
                <h1 class="text-6xl font-bold text-muted-foreground">404</h1>
                <h2 class="text-2xl font-semibold tracking-tight">Page Not Found</h2>
                <p class="text-muted-foreground">
                    Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or you may have entered an
                    incorrect URL.
                </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <Button @click="goBack" variant="outline"> Go Back </Button>
                <Button @click="goHome"> Go to Dashboard </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';

const router = useRouter();

const goBack = () => {
    if (window.history.length > 1) {
        router.go(-1);
    } else {
        goHome();
    }
};

const goHome = () => {
    const token = Cookies.get('token');
    if (token) {
        // User is authenticated, go to dashboard
        router.push('/');
    } else {
        // User is not authenticated, go to login
        router.push('/login');
    }
};
</script>
