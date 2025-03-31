/**
 * Handles input for verification code fields
 * @param index Current input field index
 * @param event Input event
 * @param codeArray Reference to the verification code array
 * @param prefix Prefix for the input field IDs
 */
export function handleVerificationCodeInput(index: number, event: Event, codeArray: string[], prefix: string = '2fa-code'): void {
    const input = event.target as HTMLInputElement
    const value = input.value

    // Set the value to the last character
    codeArray[index] = value.slice(-1)

    // Ensure the input field shows the correct value
    input.value = codeArray[index]

    // Move to next input if value is entered and we're not at the last input
    if (value && index < codeArray.length - 1) {
        const nextInput = document.getElementById(`${prefix}-${index + 1}`)
        if (nextInput) {
            nextInput.focus()
        }
    }
}

/**
 * Handles keydown events for verification code fields
 * @param index Current input field index
 * @param event Keyboard event
 * @param codeArray Reference to the verification code array
 * @param prefix Prefix for the input field IDs
 */
export function handleVerificationCodeKeyDown(index: number, event: KeyboardEvent, codeArray: string[], prefix: string = '2fa-code'): void {
    // Handle backspace - move to previous input
    if (event.key === 'Backspace' && !codeArray[index] && index > 0) {
        const prevInput = document.getElementById(`${prefix}-${index - 1}`)
        if (prevInput) {
            prevInput.focus()
        }
    }
}

/**
 * Resets the verification code array and focuses the first input
 * @param codeArray Reference to the verification code array
 * @param prefix Prefix for the input field IDs
 */
export function resetVerificationCode(codeArray: string[], prefix: string = '2fa-code'): void {
    // Clear all input fields
    for (let i = 0; i < codeArray.length; i++) {
        codeArray[i] = ''
    }

    // Focus the first input field
    setTimeout(() => {
        const firstInput = document.getElementById(`${prefix}-0`)
        if (firstInput) {
            firstInput.focus()
        }
    }, 0)
}
