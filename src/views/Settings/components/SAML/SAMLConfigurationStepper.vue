<script setup lang="ts">
import { h, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Check, FileText, Globe, Key, Shield } from 'lucide-vue-next'
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper'
import { SamlConfigService } from '@/services/saml-config.service.ts'
import { type SamlConfigInput, samlConfigSchema } from '@/views/Settings/components/SAML/schema.ts'
import { toast } from '@/components/ui/toast'

const emit = defineEmits(['complete', 'hide-stepper'])

const samlService = new SamlConfigService()
const currentStep = ref(1)
const previousStep = ref(1)
const transitionName = ref('slide-right')

const formData = ref<SamlConfigInput>({
  id: '',
  metadataUrl: '',
  entityId: '',
  x509Certificate: '',
  privateKey: '',
})

const steps = [
  {
    step: 1,
    title: 'Metadata URL',
    description: 'Enter the IDP metadata URL',
    icon: Globe,
    content: () =>
      h('div', { class: 'mt-4 space-y-4' }, [
        h('label', { class: 'block text-sm font-medium' }, 'Metadata URL'),
        h(Input, {
          modelValue: formData.value.metadataUrl,
          'onUpdate:modelValue': (val) => (formData.value.metadataUrl = val),
          placeholder: 'https://idp.example.com/metadata.xml',
        }),
        h('p', { class: 'text-sm text-muted-foreground' }, 'The URL where your Identity Provider exposes its SAML metadata'),
      ]),
  },
  {
    step: 2,
    title: 'Identifier',
    description: 'Set unique entity ID',
    icon: Shield,
    content: () =>
      h('div', { class: 'mt-4 space-y-4' }, [
        h('label', { class: 'block text-sm font-medium' }, 'Entity ID / Identifier'),
        h(Input, {
          modelValue: formData.value.entityId,
          'onUpdate:modelValue': (val) => (formData.value.entityId = val),
          placeholder: 'urn:example:sp',
        }),
        h('p', { class: 'text-sm text-muted-foreground' }, 'A unique identifier for your Service Provider'),
      ]),
  },
  {
    step: 3,
    title: 'X.509 Certificate',
    description: 'Add your public certificate',
    icon: FileText,
    content: () =>
      h('div', { class: 'mt-4 space-y-4' }, [
        h('label', { class: 'block text-sm font-medium' }, 'X.509 Certificate'),
        h(Textarea, {
          modelValue: formData.value.x509Certificate,
          'onUpdate:modelValue': (val) => (formData.value.x509Certificate = val),
          placeholder:
            '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAJC1HiIAZAiIMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV\n...\n-----END CERTIFICATE-----',
          rows: 6,
        }),
        h('p', { class: 'text-sm text-muted-foreground' }, 'The public certificate used to verify SAML messages'),
      ]),
  },
  {
    step: 4,
    title: 'Private Key',
    description: 'Add your private key',
    icon: Key,
    content: () =>
      h('div', { class: 'mt-4 space-y-4' }, [
        h('label', { class: 'block text-sm font-medium' }, 'Private Key'),
        h(Textarea, {
          modelValue: formData.value.privateKey,
          'onUpdate:modelValue': (val) => (formData.value.privateKey = val),
          placeholder:
            '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtVJkFkqHLGfEg\n...\n-----END PRIVATE KEY-----',
          rows: 6,
        }),
        h('p', { class: 'text-sm text-muted-foreground' }, 'The private key used to sign SAML requests'),
      ]),
  },
  {
    step: 5,
    title: 'Complete',
    description: 'Finish SAML IDP setup',
    icon: Check,
    content: () =>
      h('div', { class: 'mt-4 space-y-4' }, [
        h('div', { class: 'p-4 bg-green-50 rounded-md border border-green-200' }, [
          h('h3', { class: 'font-medium text-green-800' }, 'Setup Complete'),
          h('p', { class: 'text-sm text-green-700 mt-1' }, 'Your SAML Identity Provider configuration is ready to use.'),
        ]),
        h('div', { class: 'mt-6' }, [h(Button, { onClick: createSAMLConfig }, 'Save Configuration')]),
      ]),
  },
]

const updateStep = (newStep: number) => {
  transitionName.value = newStep >= currentStep.value ? 'slide-right' : 'slide-left'
  previousStep.value = currentStep.value
  currentStep.value = newStep
}

const createSAMLConfig = async () => {
  try {
    const validatedData = samlConfigSchema.parse(formData.value)
    await samlService.create(validatedData)

    emit('complete')
    emit('hide-stepper')

    toast({
      title: 'SAML Configuration Created',
      description: 'Your SAML configuration has been successfully created.',
      variant: 'success',
    })
  } catch (error) {
    console.error('Error creating SAML configuration:', error)
    toast({
      title: 'Error Creating SAML Configuration',
      description: 'There was an error creating your SAML configuration. Please try again.',
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <div>
    <Separator />
    <Stepper v-model="currentStep" class="gap-8 mt-4">
      <StepperItem v-for="item in steps" :key="item.step" class="flex-1" :step="item.step">
        <StepperTrigger class="w-full" @click="updateStep(item.step)">
          <StepperIndicator class="w-8 h-8">
            <component :is="item.icon" class="w-5 h-5" />
          </StepperIndicator>
          <div class="flex flex-col">
            <StepperTitle class="text-sm">
              {{ item.title }}
            </StepperTitle>
            <StepperDescription class="text-xs">
              {{ item.description }}
            </StepperDescription>
          </div>
        </StepperTrigger>
      </StepperItem>
    </Stepper>

    <div class="mt-8 border rounded-lg relative" style="min-height: 300px; overflow: hidden">
      <transition :name="transitionName">
        <div :key="currentStep" class="p-6 w-full">
          <component :is="steps[currentStep - 1].content" />
        </div>
      </transition>
    </div>

    <div class="mt-6 flex justify-between">
      <Button
        variant="outline"
        @click="updateStep(Math.max(1, currentStep - 1))"
        :disabled="currentStep === 1"
      >
        Previous
      </Button>
      <Button
        @click="updateStep(Math.min(steps.length, currentStep + 1))"
        :disabled="currentStep === steps.length"
      >
        {{ currentStep === steps.length - 1 ? 'Complete' : 'Next' }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1);
  position: absolute;
  width: 100%;
  backface-visibility: hidden;
  perspective: 1000px;
  transform-style: preserve-3d;
}

.slide-right-enter-from {
  transform: translateX(100%) translateZ(0);
}

.slide-right-leave-to {
  transform: translateX(-100%) translateZ(0);
}

.slide-left-enter-from {
  transform: translateX(-100%) translateZ(0);
}

.slide-left-leave-to {
  transform: translateX(100%) translateZ(0);
}
</style>
