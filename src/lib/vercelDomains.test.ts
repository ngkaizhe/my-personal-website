import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addDomainToProject, getDomainStatus, removeDomainFromProject } from './vercelDomains';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(status: number, body: unknown) {
    return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

beforeEach(() => {
    fetchMock.mockReset();
    process.env.VERCEL_TOKEN = 'tok';
    process.env.VERCEL_PROJECT_ID = 'prj_1';
    delete process.env.VERCEL_TEAM_ID;
});

describe('addDomainToProject', () => {
    it('succeeds on 200', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { name: 'a.com' }));
        expect(await addDomainToProject('a.com')).toEqual({ ok: true });
    });
    it('treats already-added-to-this-project as success', async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse(409, { error: { code: 'domain_already_in_use_by_your_projects' } }),
        );
        expect((await addDomainToProject('a.com')).ok).toBe(true);
    });
    it('surfaces other error codes', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: { code: 'forbidden' } }));
        expect(await addDomainToProject('a.com')).toEqual({ ok: false, errorCode: 'forbidden' });
    });
});

describe('getDomainStatus', () => {
    it('active when verified and configured', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(200, { verified: true }))
            .mockResolvedValueOnce(jsonResponse(200, { misconfigured: false }));
        const s = await getDomainStatus('a.com');
        expect(s.state).toBe('active');
    });
    it('pending_dns when misconfigured, with apex A record', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(200, { verified: true }))
            .mockResolvedValueOnce(jsonResponse(200, { misconfigured: true, recommendedIPv4: ['76.76.21.21'] }));
        const s = await getDomainStatus('a.com');
        expect(s.state).toBe('pending_dns');
        expect(s.dnsRecords).toEqual([{ type: 'A', name: '@', value: '76.76.21.21' }]);
    });
    it('needs_verification exposes TXT challenge, subdomain gets CNAME', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(200, {
                verified: false,
                verification: [{ type: 'TXT', domain: '_vercel.me.a.com', value: 'vc-domain-verify=xyz' }],
            }))
            .mockResolvedValueOnce(jsonResponse(200, { misconfigured: true }));
        const s = await getDomainStatus('me.a.com');
        expect(s.state).toBe('needs_verification');
        expect(s.verification[0].value).toBe('vc-domain-verify=xyz');
        expect(s.dnsRecords[0]).toEqual({ type: 'CNAME', name: 'me', value: 'cname.vercel-dns.com' });
    });
    it('not_found on 404', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse(404, { error: { code: 'not_found' } }))
            .mockResolvedValueOnce(jsonResponse(404, { error: { code: 'not_found' } }));
        expect((await getDomainStatus('a.com')).state).toBe('not_found');
    });
});

describe('removeDomainFromProject', () => {
    it('ok on 200 and on 404 (already gone)', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));
        expect((await removeDomainFromProject('a.com')).ok).toBe(true);
        fetchMock.mockResolvedValueOnce(jsonResponse(404, {}));
        expect((await removeDomainFromProject('a.com')).ok).toBe(true);
    });
});
