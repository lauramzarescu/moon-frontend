<template>
    <Dialog :open="isOpen">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription> Add a new user to the system with their credentials. </DialogDescription>
            </DialogHeader>

            <Form
                v-slot="{ setFieldValue }"
                :validation-schema="createUserFormValidationSchema"
                class="space-y-4"
                @submit="onCreateUserSubmit"
            >
                <FormField v-slot="{ componentField }" name="username">
                    <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter username" v-bind="componentField" />
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

                <FormField v-slot="{ componentField }" name="password">
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <div class="relative">
                                <Input :type="showPassword ? 'text' : 'password'" placeholder="Enter password" v-bind="componentField" />
                                <button
                                    type="button"
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                                    @click="showPassword = !showPassword"
                                >
                                    <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-500" />
                                    <EyeOffIcon v-else class="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="confirmPassword">
                    <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                            <div class="relative">
                                <Input
                                    :type="showConfirmPassword ? 'text' : 'password'"
                                    placeholder="Confirm password"
                                    v-bind="componentField"
                                />
                                <button
                                    type="button"
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                                    @click="showConfirmPassword = !showConfirmPassword"
                                >
                                    <EyeIcon v-if="!showConfirmPassword" class="h-5 w-5 text-gray-500" />
                                    <EyeOffIcon v-else class="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
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
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select a role</option>
                                <option :value="UserRole.root">Root</option>
                                <option :value="UserRole.admin">Admin</option>
                                <option :value="UserRole.user">User</option>
                            </select>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </FormField>

                <DialogFooter>
                    <Button variant="outline" @click="$emit('update:isOpen', false)">Cancel</Button>
                    <Button type="submit">Create User</Button>
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
import { createUserFormSchema } from '@/views/Settings/components/Team/schema.ts';
import { UserRole } from '@/enums/user/user.enum.ts';
import { EyeIcon, EyeOffIcon } from 'lucide-vue-next';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void;
    (e: 'userCreated'): void;
}>();

const userService = new UserService();
const createUserFormValidationSchema = toTypedSchema(createUserFormSchema);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const onCreateUserSubmit = async (values: any) => {
    try {
        // Create user with the provided details
        await userService.create({
            name: values.username,
            email: values.email,
            password: values.password,
            role: values.role,
        });

        emit('update:isOpen', false);
        emit('userCreated');

        toast({
            title: 'User created successfully',
            description: `User ${values.username} has been created.`,
        });
    } catch (error) {
        toast({
            title: 'Error creating user',
            description: error instanceof Error ? error.message : 'An unknown error occurred',
            variant: 'destructive',
        });
    }
};
</script>
