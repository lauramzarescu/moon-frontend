<template>
    <div class="cron-expression-generator">
        <!-- Enhanced sentence UI -->
        <div
            class="sentence-ui p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg shadow-sm flex items-center gap-2 overflow-x-auto whitespace-nowrap"
        >
            <span class="text-foreground shrink-0 font-medium">Run</span>

            <!-- Frequency selector with enhanced styling -->
            <Select v-model="frequencyType" @update:modelValue="updateFrequencyType" class="fancy-select">
                <SelectTrigger class="min-w-[120px] h-9 px-3 bg-background/80 backdrop-blur-sm border-none rounded-full">
                    <SelectValue :placeholder="getFrequencyLabel()" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="every-minute">every minute</SelectItem>
                    <SelectItem value="every-hour">hourly</SelectItem>
                    <SelectItem value="every-day">daily</SelectItem>
                    <SelectItem value="every-week">weekly</SelectItem>
                    <SelectItem value="every-month">monthly</SelectItem>
                    <SelectItem value="custom">custom</SelectItem>
                </SelectContent>
            </Select>

            <!-- Minute selector (conditional) -->
            <template v-if="showMinuteSelector">
                <span class="text-foreground shrink-0 font-medium">at minute</span>
                <Select v-model="minuteSpecific" @update:modelValue="updateCronExpression" class="fancy-select">
                    <SelectTrigger class="w-16 h-9 px-3 bg-background/80 backdrop-blur-sm border-none rounded-full">
                        <SelectValue :placeholder="minuteSpecific" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="i in 60" :key="i - 1" :value="(i - 1).toString()">{{ i - 1 }} </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </template>

            <!-- Hour selector (conditional) -->
            <template v-if="showHourSelector">
                <span class="text-foreground shrink-0 font-medium">at</span>
                <Select v-model="hourSpecific" @update:modelValue="updateCronExpression" class="fancy-select">
                    <SelectTrigger class="w-24 h-9 px-3 bg-background/80 backdrop-blur-sm border-none rounded-full">
                        <SelectValue :placeholder="formatHour(hourSpecific)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="i in 24" :key="i - 1" :value="(i - 1).toString()">
                                {{ formatHour(i - 1) }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </template>

            <!-- Day of week selector (conditional) -->
            <template v-if="showDayOfWeekSelector">
                <span class="text-foreground shrink-0 font-medium">on</span>
                <Select v-model="dayOfWeekSpecific" @update:modelValue="updateCronExpression" class="fancy-select">
                    <SelectTrigger class="w-32 h-9 px-3 bg-background/80 backdrop-blur-sm border-none rounded-full">
                        <SelectValue :placeholder="getDayName(dayOfWeekSpecific)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="(day, index) in daysOfWeek" :key="index" :value="index.toString()">
                                {{ day }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </template>

            <!-- Day of month selector (conditional) -->
            <template v-if="showDayOfMonthSelector">
                <span class="text-foreground shrink-0 font-medium">on the</span>
                <Select v-model="dayOfMonthSpecific" @update:modelValue="updateCronExpression" class="fancy-select">
                    <SelectTrigger class="w-20 h-9 px-3 bg-background/80 backdrop-blur-sm border-none rounded-full">
                        <SelectValue :placeholder="formatOrdinal(dayOfMonthSpecific)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="i in 31" :key="i" :value="i.toString()">{{ formatOrdinal(i) }} </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </template>

            <!-- Month selector (conditional) -->
            <template v-if="showMonthSelector">
                <span class="text-foreground shrink-0 font-medium">of</span>
                <Select v-model="monthSpecific" @update:modelValue="updateCronExpression" class="fancy-select">
                    <SelectTrigger class="w-36 h-9 px-3 bg-background/80 backdrop-blur-sm border-none rounded-full">
                        <SelectValue :placeholder="getMonthName(monthSpecific)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="(month, index) in months" :key="index + 1" :value="(index + 1).toString()">
                                {{ month }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </template>

            <div class="ml-auto flex items-center gap-3 shrink-0">
                <div class="hidden sm:block px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium">
                    {{ cronDescription }}
                </div>
                <Button variant="ghost" size="icon" class="h-9 w-9 rounded-full" @click="toggleAdvancedMode">
                    <span v-if="isAdvancedMode">
                        <ChevronUpIcon class="h-4 w-4" />
                    </span>
                    <span v-else>
                        <ChevronDownIcon class="h-4 w-4" />
                    </span>
                </Button>
            </div>
        </div>

        <div v-if="isAdvancedMode" class="mt-3 flex items-center gap-2 p-3 bg-muted/10 rounded-lg">
            <Input
                v-model="cronExpression"
                @update:modelValue="handleManualCronUpdate"
                class="flex-1 h-9 font-mono text-sm rounded-full px-4 border-primary/20 focus-visible:ring-primary/30"
            />
            <Button variant="outline" size="icon" class="h-9 w-9 rounded-full" @click="copyToClipboard">
                <ClipboardIcon class="h-4 w-4" />
            </Button>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import cronstrue from 'cronstrue';
import { ChevronDownIcon, ChevronUpIcon, ClipboardIcon } from '@heroicons/vue/24/outline';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const props = defineProps({
    modelValue: {
        type: String,
        default: '* * * * *',
    },
});

const emit = defineEmits(['update:modelValue']);

// State for each part of the cron expression
const minuteType = ref('every');
const minuteValue = ref(1);
const minuteSpecific = ref('0');

const hourType = ref('every');
const hourValue = ref(1);
const hourSpecific = ref('0');

const dayOfMonthType = ref('every');
const dayOfMonthValue = ref(1);
const dayOfMonthSpecific = ref('1');

const monthType = ref('every');
const monthValue = ref(1);
const monthSpecific = ref('1');

const dayOfWeekType = ref('every');
const dayOfWeekSpecific = ref('0');

const cronExpression = ref(props.modelValue);
const cronDescription = ref('');
const isAdvancedMode = ref(false);

const frequencyType = ref('every-day');

// Conditional display flags
const showMinuteSelector = computed(() => ['every-hour', 'every-day', 'every-week', 'every-month', 'custom'].includes(frequencyType.value));
const showHourSelector = computed(() => ['every-day', 'every-week', 'every-month', 'custom'].includes(frequencyType.value));
const showDayOfMonthSelector = computed(() => ['every-month', 'custom'].includes(frequencyType.value) && !showDayOfWeekSelector.value);
const showDayOfWeekSelector = computed(() => ['every-week', 'custom'].includes(frequencyType.value));
const showMonthSelector = computed(() => ['custom'].includes(frequencyType.value));

// Options for selects
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper functions for display
const getFrequencyLabel = () => {
    const labels = {
        'every-minute': 'every minute',
        'every-hour': 'hourly',
        'every-day': 'daily',
        'every-week': 'weekly',
        'every-month': 'monthly',
        custom: 'custom',
    };
    return labels[frequencyType.value] || 'custom';
};

const getMonthName = (monthNumber) => {
    return months[parseInt(monthNumber) - 1] || 'Select month';
};

const getDayName = (dayNumber) => {
    return daysOfWeek[parseInt(dayNumber)] || 'Select day';
};

const formatHour = (hour) => {
    const h = parseInt(hour);
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

const formatOrdinal = (n) => {
    const num = parseInt(n);
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

const updateFrequencyType = () => {
    switch (frequencyType.value) {
        case 'every-minute':
            minuteType.value = 'every';
            hourType.value = 'every';
            dayOfMonthType.value = 'every';
            monthType.value = 'every';
            dayOfWeekType.value = 'every';
            break;
        case 'every-hour':
            minuteType.value = 'specific';
            hourType.value = 'every';
            dayOfMonthType.value = 'every';
            monthType.value = 'every';
            dayOfWeekType.value = 'every';
            break;
        case 'every-day':
            minuteType.value = 'specific';
            hourType.value = 'specific';
            dayOfMonthType.value = 'every';
            monthType.value = 'every';
            dayOfWeekType.value = 'every';
            break;
        case 'every-week':
            minuteType.value = 'specific';
            hourType.value = 'specific';
            dayOfMonthType.value = 'every';
            monthType.value = 'every';
            dayOfWeekType.value = 'specific';
            break;
        case 'every-month':
            minuteType.value = 'specific';
            hourType.value = 'specific';
            dayOfMonthType.value = 'specific';
            monthType.value = 'every';
            dayOfWeekType.value = 'every';
            break;
        case 'custom':
            break;
    }
    updateCronExpression();
};

// Computed values for each part of the cron expression
const minute = computed(() => {
    if (minuteType.value === 'every') return '*';
    if (minuteType.value === 'every-n') return `*/${minuteValue.value}`;
    return minuteSpecific.value;
});

const hour = computed(() => {
    if (hourType.value === 'every') return '*';
    if (hourType.value === 'every-n') return `*/${hourValue.value}`;
    return hourSpecific.value;
});

const dayOfMonth = computed(() => {
    if (dayOfMonthType.value === 'every') return '*';
    if (dayOfMonthType.value === 'every-n') return `*/${dayOfMonthValue.value}`;
    return dayOfMonthSpecific.value;
});

const month = computed(() => {
    if (monthType.value === 'every') return '*';
    if (monthType.value === 'every-n') return `*/${monthValue.value}`;
    return monthSpecific.value;
});

const dayOfWeek = computed(() => {
    if (dayOfWeekType.value === 'every') return '*';
    return dayOfWeekSpecific.value;
});

const parseCronExpression = (expression) => {
    const parts = expression.split(' ');
    if (parts.length >= 5) {
        // Parse minute
        if (parts[0] === '*') {
            minuteType.value = 'every';
        } else if (parts[0].includes('/')) {
            minuteType.value = 'every-n';
            minuteValue.value = parseInt(parts[0].split('/')[1]);
        } else {
            minuteType.value = 'specific';
            minuteSpecific.value = parts[0];
        }

        // Parse hour
        if (parts[1] === '*') {
            hourType.value = 'every';
        } else if (parts[1].includes('/')) {
            hourType.value = 'every-n';
            hourValue.value = parseInt(parts[1].split('/')[1]);
        } else {
            hourType.value = 'specific';
            hourSpecific.value = parts[1];
        }

        // Parse day of month
        if (parts[2] === '*') {
            dayOfMonthType.value = 'every';
        } else if (parts[2].includes('/')) {
            dayOfMonthType.value = 'every-n';
            dayOfMonthValue.value = parseInt(parts[2].split('/')[1]);
        } else {
            dayOfMonthType.value = 'specific';
            dayOfMonthSpecific.value = parts[2];
        }

        // Parse month
        if (parts[3] === '*') {
            monthType.value = 'every';
        } else if (parts[3].includes('/')) {
            monthType.value = 'every-n';
            monthValue.value = parseInt(parts[3].split('/')[1]);
        } else {
            monthType.value = 'specific';
            monthSpecific.value = parts[3];
        }

        // Parse day of week
        if (parts[4] === '*') {
            dayOfWeekType.value = 'every';
        } else {
            dayOfWeekType.value = 'specific';
            dayOfWeekSpecific.value = parts[4];
        }

        determineFrequencyType();
    }
};

const determineFrequencyType = () => {
    if (
        minuteType.value === 'every' &&
        hourType.value === 'every' &&
        dayOfMonthType.value === 'every' &&
        monthType.value === 'every' &&
        dayOfWeekType.value === 'every'
    ) {
        frequencyType.value = 'every-minute';
    } else if (
        minuteType.value === 'specific' &&
        hourType.value === 'every' &&
        dayOfMonthType.value === 'every' &&
        monthType.value === 'every' &&
        dayOfWeekType.value === 'every'
    ) {
        frequencyType.value = 'every-hour';
    } else if (
        minuteType.value === 'specific' &&
        hourType.value === 'specific' &&
        dayOfMonthType.value === 'every' &&
        monthType.value === 'every' &&
        dayOfWeekType.value === 'every'
    ) {
        frequencyType.value = 'every-day';
    } else if (
        minuteType.value === 'specific' &&
        hourType.value === 'specific' &&
        dayOfMonthType.value === 'every' &&
        monthType.value === 'every' &&
        dayOfWeekType.value === 'specific'
    ) {
        frequencyType.value = 'every-week';
    } else if (
        minuteType.value === 'specific' &&
        hourType.value === 'specific' &&
        dayOfMonthType.value === 'specific' &&
        monthType.value === 'every' &&
        dayOfWeekType.value === 'every'
    ) {
        frequencyType.value = 'every-month';
    } else {
        frequencyType.value = 'custom';
    }
};

// Update the cron expression
const updateCronExpression = () => {
    const newExpression = `${minute.value} ${hour.value} ${dayOfMonth.value} ${month.value} ${dayOfWeek.value}`;
    cronExpression.value = newExpression;

    try {
        cronDescription.value = cronstrue.toString(newExpression);
    } catch (error) {
        cronDescription.value = 'Invalid cron expression';
        console.error('Error parsing cron expression:', error);
    }

    emit('update:modelValue', newExpression);
};

// Handle manual cron expression updates in advanced mode
const handleManualCronUpdate = () => {
    try {
        // Validate the expression
        cronstrue.toString(cronExpression.value);

        // If valid, parse it and update the UI
        parseCronExpression(cronExpression.value);

        // Emit the new value
        emit('update:modelValue', cronExpression.value);
    } catch (error) {
        console.error('Invalid cron expression:', error);
        // Don't update the UI if the expression is invalid
    }
};

// Toggle advanced mode
const toggleAdvancedMode = () => {
    isAdvancedMode.value = !isAdvancedMode.value;
};

// Copy to clipboard functionality
const copyToClipboard = () => {
    navigator.clipboard
        .writeText(cronExpression.value)
        .then(() => {})
        .catch((err) => {
            console.error('Failed to copy: ', err);
        });
};

// Watch for changes in the computed properties to update the cron expression
watch(
    [minute, hour, dayOfMonth, month, dayOfWeek],
    () => {
        updateCronExpression();
    },
    { immediate: true },
);

// Watch for changes in the modelValue prop
watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue !== cronExpression.value) {
            cronExpression.value = newValue;
            parseCronExpression(newValue);
        }
    },
);

// Initialize component
onMounted(() => {
    parseCronExpression(props.modelValue);
    updateCronExpression();
});
</script>

<style>
.cron-expression-generator {
    width: 100%;
    font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Roboto,
        'Helvetica Neue',
        sans-serif;
}

.sentence-ui {
    line-height: 1.5;
    overflow-x: auto;
    scrollbar-width: thin;
    transition: all 0.2s ease;
}

.sentence-ui::-webkit-scrollbar {
    height: 4px;
}

.sentence-ui::-webkit-scrollbar-track {
    background: transparent;
}

.sentence-ui::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 4px;
}

.fancy-select {
    display: inline-flex;
    vertical-align: middle;
}

.fancy-select .select-trigger {
    min-height: 2.25rem;
    background-color: hsl(var(--background) / 0.8);
    backdrop-filter: blur(4px);
    font-weight: 500;
    color: hsl(var(--primary));
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.fancy-select .select-trigger:hover {
    background-color: hsl(var(--background));
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.fancy-select .select-trigger:focus {
    box-shadow:
        0 0 0 2px hsl(var(--background)),
        0 0 0 4px hsl(var(--primary) / 0.2);
    background-color: hsl(var(--background));
}
</style>
