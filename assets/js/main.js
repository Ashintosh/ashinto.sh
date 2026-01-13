// Ensure typing.js is bundled
document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".indexHeader");
    if (header) {
        typewriter(header, {
            speed: 120,
            caretChar: "_",
            blinkAfter: true
        });
    }
})