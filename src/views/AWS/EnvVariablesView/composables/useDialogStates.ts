import { reactive, ref } from 'vue';

export function useDialogStates() {
    // Loading states
    const isDeleting = ref(false);
    const isSaving = ref(false);
    const isRestoring = ref(false);

    // Dialog states
    const bulkAddDialog = reactive({ isOpen: false });
    const bulkOperationsDialog = reactive({ isOpen: false });
    const versionComparisonDialog = reactive({ isOpen: false });
    const restoreConfirmationDialog = reactive({ isOpen: false });

    // Dialog control methods
    const openBulkAdd = () => {
        bulkAddDialog.isOpen = true;
    };

    const openBulkOperations = () => {
        bulkOperationsDialog.isOpen = true;
    };

    const openVersionComparison = () => {
        versionComparisonDialog.isOpen = true;
    };

    const openRestoreConfirmation = () => {
        restoreConfirmationDialog.isOpen = true;
    };

    const closeRestoreConfirmation = () => {
        restoreConfirmationDialog.isOpen = false;
    };

    return {
        // Loading states
        isDeleting,
        isSaving,
        isRestoring,
        
        // Dialog states
        bulkAddDialog,
        bulkOperationsDialog,
        versionComparisonDialog,
        restoreConfirmationDialog,
        
        // Dialog control methods
        openBulkAdd,
        openBulkOperations,
        openVersionComparison,
        openRestoreConfirmation,
        closeRestoreConfirmation,
    };
}
