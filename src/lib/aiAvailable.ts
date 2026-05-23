// Server-only helper. Quick Add depends on the Anthropic API; when no key is
// configured we hide the nav link and serve a degraded page instead of letting
// the parse request 500 at runtime.
export function isAiParseAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
}
