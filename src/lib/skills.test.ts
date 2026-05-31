import { describe, it, expect } from 'vitest';
import { aggregateSkills } from './skills';

describe('aggregateSkills', () => {
    it('returns empty array for empty input', () => {
        expect(aggregateSkills([])).toEqual([]);
        expect(aggregateSkills([[]])).toEqual([]);
    });

    it('dedupes case-insensitively', () => {
        const result = aggregateSkills([['Node', 'node'], ['NODE']]);
        expect(result).toEqual([{ name: 'Node', count: 3 }]);
    });

    it('preserves first-seen display label', () => {
        const result = aggregateSkills([['TypeScript'], ['typescript']]);
        expect(result[0].name).toBe('TypeScript');
        expect(result[0].count).toBe(2);
    });

    it('sorts by count desc', () => {
        const result = aggregateSkills([
            ['React', 'TypeScript'],
            ['React'],
            ['React'],
            ['TypeScript'],
        ]);
        expect(result.map(s => s.name)).toEqual(['React', 'TypeScript']);
        expect(result.map(s => s.count)).toEqual([3, 2]);
    });

    it('ignores whitespace-only entries', () => {
        const result = aggregateSkills([['  '], ['', 'Real']]);
        expect(result).toEqual([{ name: 'Real', count: 1 }]);
    });

    it('trims surrounding whitespace before bucketing', () => {
        const result = aggregateSkills([['  React  '], ['React']]);
        expect(result).toEqual([{ name: 'React', count: 2 }]);
    });
});
