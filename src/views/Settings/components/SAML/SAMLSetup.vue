<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SamlConfigService } from '@/services/saml-config.service.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { PermissionEnum } from '@/enums/user/user.enum.ts'
import { toast } from '@/components/ui/toast'
import { handleError } from '@/utils/errorHandler.ts'
import { Button } from '@/components/ui/button'
import type { SamlConfigResponseInterface } from '@/types/response/saml-config.interface.ts'
import type { SamlConfigInput } from '@/views/Settings/components/SAML/schema.ts'

import SAMLToggleSection from './SAMLToggleSection.vue'
import SAMLConfigurationForm from './SAMLConfigurationForm.vue'
import SAMLConfigurationStepper from './SAMLConfigurationStepper.vue'
import SAMLConfirmDialog from './SAMLConfirmDialog.vue'

const { hasPermission } = usePermissions()
const samlService = new SamlConfigService()

const samlEnabled = ref(false)
const samlConfig = ref<SamlConfigInput | null>(null)
const isEditing = ref(false)
const showConfirmDialog = ref(false)
const showStepper = ref(false)

const formData = ref<SamlConfigInput>({
  id: '',
  metadataUrl: '',
  entityId: '',
  x509Certificate: '',
  privateKey: '',
})

const startConfiguration = () => {
  samlConfig.value = null
  showStepper.value = true
}

const loadSAMLConfig = async () => {
  try {
    const result = (await samlService.get(samlService.resource)) as SamlConfigResponseInterface
    if (result) {
      samlConfig.value = {
        id: result.id,
        metadataUrl: result.metadataUrl,
        entityId: result.entityId,
        x509Certificate: result.serviceProviderX509Certificate,
        privateKey: result.serviceProviderPrivateKey,
      }

      formData.value = { ...samlConfig.value }
      samlEnabled.value = true
    }
  } catch (error) {
    console.error('Error loading SAML configuration:', error)
  }
}

const handleSamlToggle = (value: boolean) => {
  if (!value && samlConfig.value) {
    showConfirmDialog.value = true
  } else {
    samlEnabled.value = value
  }
}

const confirmDisableSaml = async () => {
  showConfirmDialog.value = false
  await deleteSAMLConfig()
  samlEnabled.value = false
}

const deleteSAMLConfig = async () => {
  try {
    if (!samlConfig.value?.id) {
      toast({
        title: 'Error Deleting SAML Configuration',
        description: 'There was an error deleting your SAML configuration. Please try again.',
        variant: 'destructive',
      })
      return
    }

    await samlService.delete(`${samlService.resource}/${samlConfig.value?.id}`)
    await loadSAMLConfig()
    samlConfig.value = null
    samlEnabled.value = false

    toast({
      title: 'SAML Configuration Deleted',
      description: 'Your SAML configuration has been successfully deleted.',
      variant: 'success',
    })
  } catch (error) {
    handleError(error, {
      title: 'Error Deleting SAML Configuration',
      action: 'deleting',
      entity: 'SAML configuration',
    })
  }
}

onMounted(() => {
  loadSAMLConfig()
})
</script>

<template>
  <div class="w-full mt-6">
    <!-- SAML Toggle Section -->
    <SAMLToggleSection
      :saml-enabled="samlEnabled"
      :has-permission="hasPermission(PermissionEnum.SAML_CONFIGURATION_CREATE)"
      @update:enabled="handleSamlToggle"
    />

    <!-- Confirmation Dialog -->
    <SAMLConfirmDialog
      v-model:open="showConfirmDialog"
      @confirm="confirmDisableSaml"
    />
    <div v-if="samlEnabled" class="mt-8">
      <SAMLConfigurationForm
        v-if="samlConfig"
        v-model:is-editing="isEditing"
        v-model:form-data="formData"
        :saml-config="samlConfig"
        :has-permission-delete="hasPermission(PermissionEnum.SAML_CONFIGURATION_DELETE)"
        :has-permission-write="hasPermission(PermissionEnum.SAML_CONFIGURATION_WRITE)"
        @delete="deleteSAMLConfig"
        @load="loadSAMLConfig"
      />

      <!-- Start Configuration Button -->
      <div v-else-if="!showStepper">
        <div class="flex flex-col items-center justify-center p-8 border rounded-lg mb-8">
          <h3 class="text-lg font-semibold mb-2">No SAML Configuration Found</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Start configuring SAML authentication for your organization
          </p>
          <Button variant="outline" @click="startConfiguration">Start SAML Configuration</Button>
        </div>
      </div>

      <!-- Configuration Stepper -->
      <SAMLConfigurationStepper
        v-if="showStepper && !samlConfig"
        @complete="loadSAMLConfig"
        @hide-stepper="showStepper = false"
      />
    </div>
  </div>
</template>
