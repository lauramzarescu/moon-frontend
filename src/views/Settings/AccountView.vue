<script setup lang="ts">
import AccountForm from './components/Account/AccountForm.vue';
import FormsLayout from '@/views/Settings/layout/FormsLayout.vue';
import ScheduleForm from '@/views/ScheduleForm.vue';
</script>

<template>
    <FormsLayout>
        <ScheduleForm />
        <AccountForm />
    </FormsLayout>
</template>
