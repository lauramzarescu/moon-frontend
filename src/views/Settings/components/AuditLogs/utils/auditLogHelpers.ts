import { AuditLogEnum } from '../schema.ts';

export const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
};

export const formatActionName = (action: AuditLogEnum) => {
    return action
        .replace(/:/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
};

export const getActionBadgeClass = (action: AuditLogEnum) => {
    if (action.includes('login') || action.includes('created')) {
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (action.includes('deleted')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    } else if (action.includes('updated') || action.includes('changed')) {
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else if (action.includes('logout') || action.includes('disabled')) {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
};

export const formatInfoValue = (value: unknown): string => {
    if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
};

export const getDiffLines = (objectOld: any, objectNew: any) => {
    if (!objectOld || !objectNew) {
        return [];
    }

    const oldObj = typeof objectOld === 'object' ? (objectOld as Record<string, any>) : {};
    const newObj = typeof objectNew === 'object' ? (objectNew as Record<string, any>) : {};

    const lines: Array<{ key: string; content: string; type: 'added' | 'removed' | 'unchanged' }> = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const sortedKeys = Array.from(allKeys).sort();

    sortedKeys.forEach((key) => {
        const oldValue = oldObj[key];
        const newValue = newObj[key];
        const oldValueStr = oldValue !== undefined ? JSON.stringify(oldValue, null, 2) : undefined;
        const newValueStr = newValue !== undefined ? JSON.stringify(newValue, null, 2) : undefined;

        if (oldValue === undefined && newValue !== undefined) {
            // Added
            const lines_to_add = newValueStr!.split('\n');
            lines_to_add.forEach((line, index) => {
                lines.push({
                    key: `${key}-added-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'added',
                });
            });
        } else if (oldValue !== undefined && newValue === undefined) {
            // Removed
            const lines_to_remove = oldValueStr!.split('\n');
            lines_to_remove.forEach((line, index) => {
                lines.push({
                    key: `${key}-removed-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'removed',
                });
            });
        } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            // Changed - show both old and new
            const old_lines = oldValueStr!.split('\n');
            const new_lines = newValueStr!.split('\n');

            old_lines.forEach((line, index) => {
                lines.push({
                    key: `${key}-old-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'removed',
                });
            });

            new_lines.forEach((line, index) => {
                lines.push({
                    key: `${key}-new-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'added',
                });
            });
        } else {
            // Unchanged - show context
            const unchanged_lines = oldValueStr!.split('\n');
            unchanged_lines.forEach((line, index) => {
                lines.push({
                    key: `${key}-unchanged-${index}`,
                    content: index === 0 ? `"${key}": ${line}` : line,
                    type: 'unchanged',
                });
            });
        }
    });

    return lines;
};

export const getDiffSummary = (objectOld: any, objectNew: any) => {
    if (!objectOld || !objectNew) {
        return [];
    }

    const oldObj = typeof objectOld === 'object' ? (objectOld as Record<string, any>) : {};
    const newObj = typeof objectNew === 'object' ? (objectNew as Record<string, any>) : {};

    const changes: Array<{ field: string; type: 'added' | 'removed' | 'changed' }> = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    allKeys.forEach((key) => {
        const oldValue = oldObj[key];
        const newValue = newObj[key];

        if (oldValue === undefined && newValue !== undefined) {
            changes.push({ field: key, type: 'added' });
        } else if (oldValue !== undefined && newValue === undefined) {
            changes.push({ field: key, type: 'removed' });
        } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({ field: key, type: 'changed' });
        }
    });

    return changes;
};
