<template>
    <ProviderHeader />
    <Timeline />
</template>

<style>
@media (min-width: 1024px) {
    .about {
        min-height: 100vh;
        display: flex;
        align-items: center;
    }
}
</style>

<script setup lang="ts">
import ProviderHeader from '@/components/ui/provider-header/ProviderHeader.vue';
import Timeline from '@/views/AWS/Timeline/Timeline.vue';
</script>
