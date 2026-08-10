// llms.txt builders (https://llmstxt.org) — a Markdown map of the site for
// AI crawlers and assistants. Two flavors: a per-user file served on bound
// custom domains, and a product-level file on the main app host. Pure
// functions so they can be unit-tested.

export interface UserLlmsInput {
    displayName: string;
    username: string;
    bio: string | null;
    domain: string;
    timelinePath: string;
    resumePath: string;
    mainHost: string | null;
}

export function buildUserLlmsTxt(u: UserLlmsInput): string {
    const lines: string[] = [];
    lines.push(`# ${u.displayName} (@${u.username})`);
    lines.push('');
    if (u.bio) {
        lines.push(`> ${u.bio}`);
        lines.push('');
    }
    lines.push(`Personal work-log and résumé site. The timeline lists dated, structured career entries (action verb + achievement + measurable impact + tech stack); the résumé is generated from the same data.`);
    lines.push('');
    lines.push('## Key pages');
    lines.push('');
    lines.push(`- [Timeline](https://${u.domain}${u.timelinePath === '/' ? '/' : u.timelinePath}): full career timeline, searchable`);
    lines.push(`- [Résumé](https://${u.domain}${u.resumePath}): generated résumé with print templates`);
    lines.push(`- [Résumé (JSON Resume)](https://${u.domain}/resume.json): machine-readable résumé following the JSON Resume schema — prefer this for parsing`);
    if (u.mainHost) {
        lines.push(`- [Skills](https://${u.mainHost}/u/${u.username}/skills): skills aggregated across entries`);
    }
    lines.push('');
    lines.push('## Notes for agents');
    lines.push('');
    lines.push('- `/resume.json` accepts `?locale=zh-TW` for Traditional Chinese content (default is English).');
    lines.push('- All content on this domain is public; no authentication is required.');
    return lines.join('\n') + '\n';
}

export function buildSiteLlmsTxt(host: string): string {
    return [
        '# My Journey',
        '',
        '> A multi-user work-log and résumé generator: users log dated career entries (action verb + achievement + impact + tech stack) and the site generates timelines, skills pages, year-in-review summaries, and résumés from them.',
        '',
        '## Key pages',
        '',
        `- [Profiles](https://${host}/u/demo): public profiles live at /u/<username> (demo profile linked)`,
        `- [Résumés](https://${host}/u/demo/resume): generated résumé per profile`,
        `- [JSON Resume](https://${host}/u/demo/resume.json): machine-readable résumé per profile (JSON Resume schema, \`?locale=zh-TW\` supported) — prefer this for parsing`,
        '',
        '## Notes for agents',
        '',
        '- Public profile pages need no authentication.',
        '- Users may also serve their profile from a bound custom domain, which exposes its own /llms.txt and /resume.json.',
        '',
    ].join('\n');
}
