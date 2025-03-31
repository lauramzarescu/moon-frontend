<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SamlConfigService } from '@/services/saml-config.service.ts';
import type { SamlConfigInput } from '@/views/Settings/components/SAML/schema.ts';
import { createPartialUpdateSchema } from '@/views/Settings/components/SAML/schema.ts';
import { toast } from '@/components/ui/toast';
import { handleError } from '@/utils/errorHandler.ts';

const props = defineProps({
    isEditing: {
        type: Boolean,
        required: true,
    },
    formData: {
        type: Object as () => SamlConfigInput,
        required: true,
    },
    samlConfig: {
        type: Object as () => SamlConfigInput,
        required: true,
    },
    hasPermissionDelete: {
        type: Boolean,
        required: true,
    },
    hasPermissionWrite: {
        type: Boolean,
        required: true,
    },
});

const emit = defineEmits(['update:is-editing', 'update:form-data', 'delete', 'load']);

const samlService = new SamlConfigService();

const startEditing = () => {
    emit('update:is-editing', true);
    emit('update:form-data', { ...props.samlConfig });
};

const cancelEditing = () => {
    emit('update:is-editing', false);
    emit('update:form-data', { ...props.samlConfig });
};

const updateSAMLConfig = async () => {
    try {
        const changedFieldsMap = {
            metadataUrl: props.samlConfig?.metadataUrl !== props.formData.metadataUrl,
            entityId: props.samlConfig?.entityId !== props.formData.entityId,
            x509Certificate: props.samlConfig?.x509Certificate !== props.formData.x509Certificate,
            privateKey: props.samlConfig?.privateKey !== props.formData.privateKey,
        };

        const changedFields = Object.entries(changedFieldsMap)
            .filter(([_, hasChanged]) => hasChanged)
            .reduce((acc, [key]) => {
                const k = key as keyof SamlConfigInput;
                acc[k] = props.formData[k];
                return acc;
            }, {} as Partial<SamlConfigInput>);

        if (Object.keys(changedFields).length > 0) {
            const dynamicSchema = createPartialUpdateSchema(changedFieldsMap);
            const validatedData = dynamicSchema.parse(props.formData);

            await samlService.update(validatedData.id || '', changedFields as SamlConfigInput);
            emit('load');

            toast({
                title: 'SAML Configuration Updated',
                description: 'Your changes have been saved successfully',
                variant: 'success',
            });
        }

        emit('update:is-editing', false);
    } catch (error) {
        handleError(error, {
            title: 'Error Updating SAML Configuration',
            action: 'updating',
            entity: 'SAML configuration',
        });
    }
};
</script>

<template>
    <div class="border rounded-lg p-6 space-y-6">
        <div class="space-y-4">
            <h3 class="text-lg font-semibold">Current SAML Configuration</h3>

            <div class="space-y-2">
                <label class="block text-sm font-medium">Metadata URL</label>
                <Input
                    :model-value="isEditing ? formData.metadataUrl : samlConfig.metadataUrl"
                    @update:model-value="(val) => $emit('update:form-data', { ...formData, metadataUrl: val })"
                    :disabled="!isEditing"
                />
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium">Entity ID</label>
                <Input
                    :model-value="isEditing ? formData.entityId : samlConfig.entityId"
                    @update:model-value="(val) => $emit('update:form-data', { ...formData, entityId: val })"
                    :disabled="!isEditing"
                />
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium">X.509 Certificate</label>
                <Textarea
                    :model-value="isEditing ? formData.x509Certificate : samlConfig.x509Certificate"
                    @update:model-value="(val) => $emit('update:form-data', { ...formData, x509Certificate: val })"
                    :disabled="!isEditing"
                    rows="6"
                />
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium">Private Key</label>
                <Textarea
                    :model-value="isEditing ? formData.privateKey : samlConfig.privateKey"
                    @update:model-value="(val) => $emit('update:form-data', { ...formData, privateKey: val })"
                    :disabled="!isEditing"
                    rows="6"
                />
            </div>
        </div>

        <div class="flex justify-end space-x-4">
            <template v-if="!isEditing">
                <Button variant="destructive" @click="$emit('delete')" :disabled="!hasPermissionDelete"> Delete Configuration </Button>
                <Button variant="outline" @click="startEditing" :disabled="!hasPermissionWrite"> Edit Configuration </Button>
            </template>
            <template v-else>
                <Button variant="outline" @click="cancelEditing">Cancel</Button>
                <Button @click="updateSAMLConfig">Save Changes</Button>
            </template>
        </div>
    </div>
</template>
