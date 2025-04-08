<script setup lang="ts"></script>

<template>
    <div class="md:hidden">
        <VPImage
            alt="Forms"
            width="1280"
            height="1214"
            class="block"
            :image="{
                dark: '/examples/forms-dark.png',
                light: '/examples/forms-light.png',
            }"
        />
    </div>
    <div class="hidden md:block">
        <div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
            <div class="flex-1 lg:max-w-4xl">
                <div class="space-y-6">
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>
