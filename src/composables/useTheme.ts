import { ref, watch } from 'vue';

export function useTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    const isDark = ref(theme ? theme === 'dark' : false);

    document.documentElement.classList.toggle(theme);

    function toggleTheme() {
        isDark.value = !isDark.value;
        document.documentElement.classList.toggle('dark');
    }

    // Initialize theme based on system preference
    watch(
        isDark,
        (value) => {
            localStorage.setItem('theme', value ? 'dark' : 'light');
        },
        { immediate: true },
    );

    return {
        isDark,
        toggleTheme,
    };
}
