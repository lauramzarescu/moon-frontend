<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import CronExpressionGenerator from '@/components/CronExpressionGenerator.vue';

const props = defineProps<{
    schedulerConfig: Record<string, unknown>;
}>();

const emit = defineEmits<{
    (e: 'update:schedulerConfig', value: Record<string, unknown>): void;
}>();

const cronExpression = ref('0 0 * * *');

onMounted(() => {
    if (props.schedulerConfig?.customCronExpression) {
        cronExpression.value = props.schedulerConfig.customCronExpression as string;
    } else {
        // Create a new object to trigger reactivity
        const updatedConfig = { ...props.schedulerConfig, customCronExpression: cronExpression.value };
        emit('update:schedulerConfig', updatedConfig);
    }
});

const handleCronExpressionChange = (value: string) => {
    cronExpression.value = value;
    // Create a new object to trigger reactivity
    const updatedConfig = { ...props.schedulerConfig, customCronExpression: value };
    emit('update:schedulerConfig', updatedConfig);
    console.log('Cron expression updated:', updatedConfig);
};

watch(cronExpression, (newValue) => {
    // Create a new object to trigger reactivity
    const updatedConfig = { ...props.schedulerConfig, customCronExpression: newValue };
    emit('update:schedulerConfig', updatedConfig);
});
</script>

<template>
    <div class="space-y-6">
        <FormField name="schedulerConfig.customCronExpression" v-slot="{ field }">
            <FormItem>
                <FormLabel>Schedule (Cron Expression)</FormLabel>
                <FormControl>
                    <CronExpressionGenerator v-model="cronExpression" @update:modelValue="handleCronExpressionChange" />
                </FormControl>
                <p class="text-xs text-muted-foreground mt-1">Define your schedule using the visual cron expression builder above.</p>
                <FormMessage />
            </FormItem>
        </FormField>
    </div>
</template>
