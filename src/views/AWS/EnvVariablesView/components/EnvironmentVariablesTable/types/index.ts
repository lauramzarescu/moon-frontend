import { VariableType } from '@/types/aws/environment-variable.enums';
import { VariableDataType } from '../utils/variableUtils';

export interface Variable {
    id?: string;
    name: string;
    value: string;
    isSecret?: boolean;
    isNew?: boolean;
    valueFrom?: string;
}

export interface ConfirmationDialogState {
    isOpen: boolean;
    variable: Variable | null;
    type: VariableType | null;
    isBulk: boolean;
    variablesToDelete: Variable[];
}

export interface EnhancedEditorState {
    isOpen: boolean;
    variable: Variable | null;
    variableId: string;
    name: string;
    value: string;
    isJson: boolean;
    prettyJson: boolean;
    originalValue: string;
    selectedType: VariableDataType;
    autoDetectedType: VariableDataType;
}
