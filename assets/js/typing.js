/**
 * Typewriter effect for any element.
 * @param {HTMLElement} element - The element to type into
 * @param {Oject} options - Configuration options
 *      text: string to type (defaults to element's current text)
 *      speed: typing speed in ms per character (default 150)
 *      caretChar: character for caret (default "_")
 *      blinkAfter: boolean, blink only after typing (default true)
 */
function typewriter(element, options = {}) {
    if (!element) return;

    const text = options.text ?? element.textContent.trim();
    const speed = options.speed ?? 150;
    const caretChar = options.caretChar ?? "_";
    const blinkAfter = options.blinkAfter ?? true;

    element.textContent = ""

    const caret = document.createElement("span");
    caret.className = "cursor";
    caret.textContent = caretChar;
    element.appendChild(caret);

    let i = 0;

    function type() {
        if (i < text.length) {
            element.insertBefore(document.createTextNode(text[i]), caret);
            i++;
            setTimeout(type, speed);
        } else if (blinkAfter) {
            caret.style.animation = "blink 1s step-start infinite";
        }
    }

    type();
}
