<template>
  <div>
    <h3 class="pt-5 text-lg font-medium">Team Management</h3>
    <p class="text-sm text-muted-foreground">Manage system users and their roles.</p>
  </div>
  <Separator />

  <!-- Access Control Section -->
  <AccessControlSection />

  <!-- Team Members Section -->
  <TeamMembersSection />

</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Separator } from '@/components/ui/separator'
import AccessControlSection from '@/views/Settings/components/Team/AccessControlSection.vue'
import TeamMembersSection from '@/views/Settings/components/Team/TeamMembersSection.vue'

const showPasswordModal = ref(false)
</script>
