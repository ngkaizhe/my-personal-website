import { describe, it, expect } from 'vitest';
import { categorizeSkill, groupSkills } from './skillCategories';

describe('categorizeSkill', () => {
    it('routes representative skills to the right buckets', () => {
        expect(categorizeSkill('C#')).toBe('languages');
        expect(categorizeSkill('.NET 8')).toBe('languages');
        expect(categorizeSkill('TensorFlow')).toBe('languages');
        expect(categorizeSkill('OpenRTB')).toBe('adtech');
        expect(categorizeSkill('Facebook Marketing API')).toBe('adtech');
        expect(categorizeSkill('Apache Spark')).toBe('data');
        expect(categorizeSkill('Kubernetes')).toBe('data');
        expect(categorizeSkill('VictoriaMetrics')).toBe('data');
        expect(categorizeSkill('GitLab CI')).toBe('practices');
        expect(categorizeSkill('A/B Testing')).toBe('practices');
        expect(categorizeSkill('MCP')).toBe('practices');
        expect(categorizeSkill('Underwater Basket Weaving')).toBe('other');
    });

    it('prefers adtech over languages for API-flavored ad skills', () => {
        expect(categorizeSkill('Google Ads API')).toBe('adtech');
    });
});

describe('groupSkills', () => {
    it('groups in category order, keeps in-group order, omits empty buckets', () => {
        const groups = groupSkills([
            { name: 'C#', count: 12 },
            { name: 'OpenRTB', count: 4 },
            { name: 'Python', count: 4 },
            { name: 'HDFS', count: 1 },
        ]);
        expect(groups.map(g => g.key)).toEqual(['languages', 'adtech', 'data']);
        expect(groups[0].skills.map(s => s.name)).toEqual(['C#', 'Python']);
    });
});
