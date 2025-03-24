<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const props = defineProps({
  samlEnabled: {
    type: Boolean,
    required: true,
  },
  hasPermission: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:enabled', 'request-disable'])

// Handle toggle change
const handleToggleChange = (newValue: boolean) => {
  if (!newValue && props.samlEnabled) {
    // When turning off SAML, emit event to show confirmation dialog
    emit('request-disable')
    return
  }

  emit('update:enabled', newValue)
}
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
        :checked="samlEnabled"
        @update:checked="handleToggleChange"
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
