import { computed, ref } from 'vue';

interface UnsavedChange {
    serviceName: string;
    clusterName: string;
    newVariables: any[];
    editedVariables: any[];
    timestamp: number;
}

const STORAGE_KEY = 'env-variables-unsaved-changes';
const unsavedChanges = ref<Map<string, UnsavedChange>>(new Map());

// Load from localStorage on initialization
const loadUnsavedChanges = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            unsavedChanges.value = new Map(Object.entries(data));
        }
    } catch (error) {
        console.error('Error loading unsaved changes:', error);
    }
};

// Save to localStorage
const saveToStorage = () => {
    try {
        const data = Object.fromEntries(unsavedChanges.value);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving unsaved changes:', error);
    }
};

// Initialize on first import
loadUnsavedChanges();

export const useUnsavedChanges = () => {
    const getServiceKey = (serviceName: string, clusterName: string) => {
        return `${clusterName}:${serviceName}`;
    };

    const hasUnsavedChanges = (serviceName: string, clusterName: string) => {
        const key = getServiceKey(serviceName, clusterName);
        return unsavedChanges.value.has(key);
    };

    const getUnsavedChanges = (serviceName: string, clusterName: string) => {
        const key = getServiceKey(serviceName, clusterName);
        return unsavedChanges.value.get(key) || null;
    };

    const saveUnsavedChanges = (serviceName: string, clusterName: string, newVariables: any[], editedVariables: any[]) => {
        const key = getServiceKey(serviceName, clusterName);

        // Only save if there are actual changes
        if (newVariables.length > 0 || editedVariables.length > 0) {
            unsavedChanges.value.set(key, {
                serviceName,
                clusterName,
                newVariables,
                editedVariables,
                timestamp: Date.now(),
            });
        } else {
            // Remove if no changes
            unsavedChanges.value.delete(key);
        }

        saveToStorage();
    };

    const clearUnsavedChanges = (serviceName: string, clusterName: string) => {
        const key = getServiceKey(serviceName, clusterName);
        unsavedChanges.value.delete(key);
        saveToStorage();
    };

    const clearAllUnsavedChanges = () => {
        unsavedChanges.value.clear();
        saveToStorage();
    };

    const getAllUnsavedServices = computed(() => {
        return Array.from(unsavedChanges.value.values());
    });

    const getUnsavedChangesCount = (serviceName: string, clusterName: string) => {
        const changes = getUnsavedChanges(serviceName, clusterName);
        if (!changes) return 0;
        return changes.newVariables.length + changes.editedVariables.length;
    };

    return {
        hasUnsavedChanges,
        getUnsavedChanges,
        saveUnsavedChanges,
        clearUnsavedChanges,
        clearAllUnsavedChanges,
        getAllUnsavedServices,
        getUnsavedChangesCount,
    };
};
