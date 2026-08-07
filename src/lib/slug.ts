// Dependency-free on purpose: prisma/seed.ts imports this by relative path
// under ts-node, where the `@/*` alias isn't resolved.

/**
 * Cross-locale stable key for a tag. The display label can be "Engineering"
 * in en and "工程" in zh-TW, but resume sectioning, badge colour and filtering
 * all key off this slug. Stored on Entry.tagSlug; regenerated from the
 * primary-locale tag whenever the entry is written.
 */
export function tagToSlug(tag: string): string {
    return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
