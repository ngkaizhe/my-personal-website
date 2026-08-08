// Groups the freeform techStack skill names into résumé-friendly categories
// so the Skills section reads as a competency block instead of a flat tag
// cloud. Keyword-based: first matching rule wins, unmatched names land in
// "other". Pure + exported for tests.

export type SkillCategoryKey = 'languages' | 'adtech' | 'data' | 'practices' | 'other';

export const SKILL_CATEGORY_ORDER: SkillCategoryKey[] = [
    'languages', 'adtech', 'data', 'practices', 'other',
];

const RULES: [SkillCategoryKey, RegExp][] = [
    ['adtech', /openrtb|prebid|\brtb\b|bidding|\bdsp\b|\bssp\b|\bgtm\b|pixel|marketing api|ads api|ad exchange|taboola|ucfunnel|catalog/i],
    ['languages', /^c#$|^c\+\+$|\.net|python|typescript|javascript|^java$|react|next\.js|node|vue|angular|tailwind|asp\.net|tensorflow|pytorch|onnx|unity|html|css|golang|^go$|rust|swift|kotlin/i],
    ['data', /spark|hdfs|hadoop|kubernetes|\bk8s\b|docker|minio|\bs3\b|victoriametrics|prometheus|grafana|redis|mysql|postgres|cassandra|scylla|kafka|nginx|linux|parquet|\bgpu\b|argo|ansible|terraform|airflow|elasticsearch|mongo|database|storage|\baws\b|\bgcp\b|azure|factorization machines|pose estimation|machine learning|deep learning/i],
    ['practices', /gitlab|github|\bgit\b|\bci\b|testing|a\/b|pattern|pid control|xpath|htmlagilitypack|claude|\bmcp\b|\bllm\b|agile|scrum|protocol buffers|grpc|rest|graphql|oauth|design/i],
];

export function categorizeSkill(name: string): SkillCategoryKey {
    for (const [key, pattern] of RULES) {
        if (pattern.test(name)) return key;
    }
    return 'other';
}

export interface SkillGroup {
    key: SkillCategoryKey;
    skills: { name: string; count: number }[];
}

/** Groups skills preserving their incoming (usage-count) order; empty
 *  categories are omitted. */
export function groupSkills(skills: { name: string; count: number }[]): SkillGroup[] {
    const byKey = new Map<SkillCategoryKey, { name: string; count: number }[]>();
    for (const skill of skills) {
        const key = categorizeSkill(skill.name);
        const list = byKey.get(key) ?? [];
        list.push(skill);
        byKey.set(key, list);
    }
    return SKILL_CATEGORY_ORDER
        .filter(key => (byKey.get(key)?.length ?? 0) > 0)
        .map(key => ({ key, skills: byKey.get(key)! }));
}
