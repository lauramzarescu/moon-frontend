<script setup lang="ts">
import UserAuthForm from '@/views/Login/components/UserAuthForm.vue';
</script>

<template>
    <div class="bg-background w-full h-full container flex items-center justify-center">
        <div class="bg-background mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div class="flex flex-col space-y-4 text-center">
                <h1 class="text-2xl font-semibold tracking-tight">Login</h1>
                <p class="text-sm text-foreground">Enter your credentials below to sign in to your account</p>
            </div>
            <UserAuthForm />
        </div>
    </div>
</template>
