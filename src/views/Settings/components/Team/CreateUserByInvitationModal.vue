<template>
    <Dialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Send User Invitation</DialogTitle>
                <DialogDescription>
                    Send an invitation email to a new user. They will receive an email with instructions to set up their account.
                </DialogDescription>
            </DialogHeader>

            <Form :validation-schema="createUserByInvitationFormValidationSchema" class="space-y-4" @submit="onInviteUserSubmit">
                <FormField v-slot="{ componentField }" name="name">
                    <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter full name" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="email">
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="Enter email address" v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="role">
                    <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                            <select
                                v-bind="componentField"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select a role</option>
                                <option :value="UserRole.admin">Admin</option>
                                <option :value="UserRole.user">User</option>
                            </select>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <DialogFooter>
                    <Button type="button" variant="outline" @click="closeModal">Cancel</Button>
                    <Button type="submit" :disabled="isLoading">
                        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                        Send Invitation
                    </Button>
                </DialogFooter>
            </Form>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toTypedSchema } from '@vee-validate/zod';
import { UserService } from '@/services/user.service.ts';
import { UserRole } from '@/enums/user/user.enum.ts';
import { Loader2 } from 'lucide-vue-next';
import { createUserByInvitationFormSchema } from '@/views/Settings/components/Team/schema.ts';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void;
    (e: 'invitation-sent'): void;
}>();

const userService = new UserService();
const createUserByInvitationFormValidationSchema = toTypedSchema(createUserByInvitationFormSchema);
const isLoading = ref(false);

const closeModal = () => {
    emit('update:isOpen', false);
};

const onInviteUserSubmit = async (values: any) => {
    isLoading.value = true;
    try {
        // Send invitation with the provided details
        await userService.createByInvitation({
            name: values.name,
            email: values.email,
            role: values.role,
        });

        emit('update:isOpen', false);
        emit('invitation-sent');

        toast({
            title: 'Invitation sent successfully',
            description: `Invitation has been sent to ${values.email}.`,
        });
    } catch (error) {
        toast({
            title: 'Error sending invitation',
            description: error instanceof Error ? error.message : 'An unknown error occurred',
            variant: 'destructive',
        });
    } finally {
        isLoading.value = false;
    }
};
</script>
