import { toast } from '@/components/ui/toast';
import { z } from 'zod';

interface ErrorHandlerOptions {
    title?: string;
    action?: 'creating' | 'updating' | 'deleting' | 'processing';
    entity?: string;
}

export const handleError = (error: unknown, options: ErrorHandlerOptions = {}) => {
    const { title = 'Error', action = 'processing', entity = 'item' } = options;

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
        error.issues.forEach((issue) => {
            toast({
                title: `Validation Error`,
                description: issue.message,
                variant: 'destructive',
            });
        });
        return;
    }

    // Log error for debugging
    console.error(`Error ${action} ${entity}:`, error);

    // Show generic toast
    toast({
        title,
        description: `There was an error ${action} ${entity}. Please try again.`,
        variant: 'destructive',
    });
};
