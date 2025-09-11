<template>
    <span v-html="highlightedText"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Highlight {
    index: number;
    length: number;
    text: string;
}

interface Props {
    text: string;
    highlights: Highlight[];
}

const props = defineProps<Props>();

const highlightedText = computed(() => {
    if (!props.highlights.length) {
        return escapeHtml(props.text);
    }

    let result = '';
    let lastIndex = 0;

    // Sort highlights by index to process them in order
    const sortedHighlights = [...props.highlights].sort((a, b) => a.index - b.index);

    for (const highlight of sortedHighlights) {
        // Add text before the highlight
        if (highlight.index > lastIndex) {
            result += escapeHtml(props.text.slice(lastIndex, highlight.index));
        }

        // Add the highlighted text
        const highlightedPart = escapeHtml(props.text.slice(highlight.index, highlight.index + highlight.length));
        result += `<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">${highlightedPart}</mark>`;

        lastIndex = highlight.index + highlight.length;
    }

    // Add remaining text after the last highlight
    if (lastIndex < props.text.length) {
        result += escapeHtml(props.text.slice(lastIndex));
    }

    return result;
});

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
</script>
