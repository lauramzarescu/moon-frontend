import { computed, reactive, ref, type Ref } from 'vue';
import { useToast } from '@/components/ui/toast';
import { ExportFormat } from '@/types/aws';
import type { VariableData } from './useBulkVariables';

export function useBulkExport(getVariableData: Ref<Map<string, VariableData>>) {
    const { toast } = useToast();

    const exportFormat = ref<ExportFormat>(ExportFormat.ENV);
    const exportOptions = reactive({
        includeSecrets: false,
        includeComments: true,
    });

    const exportPreview = computed(() => {
        const variableData = getVariableData.value;

        if (variableData.size === 0) {
            return 'No variables selected';
        }

        const variables = Array.from(variableData.values());

        switch (exportFormat.value) {
            case ExportFormat.ENV:
                return generateEnvFormat(variables);
            case ExportFormat.JSON:
                return generateJsonFormat(variables);
            case ExportFormat.YAML:
                return generateYamlFormat(variables);
            case ExportFormat.DOCKER_COMPOSE:
                return generateDockerComposeFormat(variables);
            default:
                return 'Unsupported format';
        }
    });

    const generateEnvFormat = (variables: VariableData[]): string => {
        let content = '';

        if (exportOptions.includeComments) {
            content += '# Environment Variables\n';
            content += `# Exported on ${new Date().toISOString()}\n\n`;
        }

        variables.forEach((variable) => {
            if (variable.isSecret && !exportOptions.includeSecrets) {
                if (exportOptions.includeComments) {
                    content += `# ${variable.name}=<SECRET_VALUE>\n`;
                }
                return;
            }

            if (exportOptions.includeComments && variable.isSecret) {
                content += `# Secret variable\n`;
            }

            const line = `${variable.name}=${variable.value}`;
            content += `${variable.isSecret ? (exportOptions.includeSecrets ? `SECRET:${line}` : line) : line}\n`;
        });

        return content;
    };

    const generateJsonFormat = (variables: VariableData[]): string => {
        const envVars: Record<string, string> = {};
        const secrets: Record<string, string> = {};

        variables.forEach((variable) => {
            if (variable.isSecret) {
                if (exportOptions.includeSecrets) {
                    secrets[variable.name] = variable.value;
                }
            } else {
                envVars[variable.name] = variable.value;
            }
        });

        const result: any = { environmentVariables: envVars };

        if (exportOptions.includeSecrets && Object.keys(secrets).length > 0) {
            result.secrets = secrets;
        }

        return JSON.stringify(result, null, 2);
    };

    const generateYamlFormat = (variables: VariableData[]): string => {
        let content = '';

        if (exportOptions.includeComments) {
            content += `# Environment Variables\n`;
            content += `# Exported on ${new Date().toISOString()}\n\n`;
        }

        content += 'environmentVariables:\n';

        const envVars = variables.filter((v) => !v.isSecret);
        const secrets = variables.filter((v) => v.isSecret);

        envVars.forEach((variable) => {
            content += `  ${variable.name}: "${variable.value}"\n`;
        });

        if (exportOptions.includeSecrets && secrets.length > 0) {
            content += '\nsecrets:\n';
            secrets.forEach((variable) => {
                content += `  ${variable.name}: "${variable.value}"\n`;
            });
        }

        return content;
    };

    const generateDockerComposeFormat = (variables: VariableData[]): string => {
        let content = '';

        if (exportOptions.includeComments) {
            content += `# Docker Compose Environment Variables\n`;
            content += `# Exported on ${new Date().toISOString()}\n\n`;
        }

        content += 'environment:\n';

        variables.forEach((variable) => {
            if (variable.isSecret && !exportOptions.includeSecrets) {
                if (exportOptions.includeComments) {
                    content += `  # ${variable.name}: <SECRET_VALUE>\n`;
                }
                return;
            }

            if (exportOptions.includeComments && variable.isSecret) {
                content += `  # Secret variable\n`;
            }

            content += `  - ${variable.name}=${variable.value}\n`;
        });

        return content;
    };

    const performExport = () => {
        try {
            const content = exportPreview.value;
            const filename = `environment-variables.${getFileExtension()}`;

            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            toast({
                variant: 'success',
                title: 'Export Successful',
                description: `Variables exported to ${filename}`,
            });

            return true;
        } catch (error: any) {
            console.error('Export failed:', error);
            toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: error.message || 'Failed to export variables',
            });
            return false;
        }
    };

    const getFileExtension = (): string => {
        switch (exportFormat.value) {
            case ExportFormat.JSON:
                return 'json';
            case ExportFormat.YAML:
                return 'yml';
            case ExportFormat.DOCKER_COMPOSE:
                return 'docker-compose.yml';
            default:
                return 'env';
        }
    };

    const resetExportState = () => {
        exportFormat.value = ExportFormat.ENV;
        exportOptions.includeSecrets = false;
        exportOptions.includeComments = true;
    };

    return {
        exportFormat,
        exportOptions,
        exportPreview,
        performExport,
        resetExportState,
    };
}
