/**
 * Get telemetry source from URL parameter
 * Usage: http://localhost:5173?source=mock or ?source=backend
 * Default: 'backend'
 */
export function getSource() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('source') || 'backend';
}

/**
 * Get design variant from URL parameter
 * Usage: http://localhost:5173?variant=a or ?variant=b
 * Default: 'a'
 */
export function getVariant() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('variant') || 'a';
}