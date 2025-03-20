<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

defineProps({
  samlEnabled: {
    type: Boolean,
    required: true,
  },
  hasPermission: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:enabled'])
</script>

<template>
  <div class="mb-8 p-4 border rounded-lg">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">SAML Authentication</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Enable SAML-based single sign-on for your organization
        </p>
      </div>
      <Switch
        :enabled="samlEnabled"
        @update:checked="emit('update:enabled', $event)"
        :disabled="!hasPermission"
      />
    </div>

    <Alert variant="warning" class="mt-4" v-if="samlEnabled">
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        When SAML authentication is enabled, username/password login will be disabled.
      </AlertDescription>
    </Alert>
  </div>
</template>
