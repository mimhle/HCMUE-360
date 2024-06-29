export function easeOutExpo(n) {
    return n === 1 ? 1 : 1 - Math.pow(2, -10 * n);
}