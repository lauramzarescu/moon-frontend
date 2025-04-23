<template>
    <div class="p-4 max-w-3xl mx-auto">
        <h2 class="text-lg font-medium mb-2">Task Schedule</h2>
        <CronExpressionGenerator v-model="schedule" />

        <div class="mt-8 p-4 border rounded-md">
            <h3 class="font-medium">Preview</h3>
            <p class="mt-2">Your task will run according to this schedule: {{ schedule }}</p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import CronExpressionGenerator from '@/components/CronExpressionGenerator.vue';

const schedule = ref('0 9 * * 1-5'); // Default: At 9:00 AM, Monday through Friday
</script>
