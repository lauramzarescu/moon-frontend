import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Alert } from './Alert.vue';
export { default as AlertDescription } from './AlertDescription.vue';
export { default as AlertTitle } from './AlertTitle.vue';

export const alertVariants = cva(
    'relative w-full rounded-lg border border-slate-200 px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-slate-950 [&>svg~*]:pl-7 dark:border-slate-800 dark:[&>svg]:text-slate-50',
    {
        variants: {
            variant: {
                default: 'bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50',
                success:
                    'border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-600 dark:border-green-900/50 dark:text-green-600 dark:border-green-900 dark:[&>svg]:text-green-600',
                info: 'border-blue-500/50 text-blue-700 dark:border-blue-500 [&>svg]:text-blue-600 dark:border-blue-900/50 dark:text-blue-600 dark:border-blue-900 dark:[&>svg]:text-blue-600',
                warning:
                    'border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-600 dark:border-yellow-900/50 dark:text-yellow-600 dark:border-yellow-900 dark:[&>svg]:text-yellow-600',
                destructive:
                    'border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500 dark:border-red-900/50 dark:text-red-900 dark:dark:border-red-900 dark:[&>svg]:text-red-900',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export type AlertVariants = VariantProps<typeof alertVariants>;
