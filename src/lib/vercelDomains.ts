// Thin wrapper around the Vercel Domains REST API. Server-side only.
// Docs: https://vercel.com/docs/rest-api/endpoints/projects

const API = 'https://api.vercel.com';

// Fallbacks when the config endpoint doesn't return recommended records.
const FALLBACK_APEX_A = '76.76.21.21';
const FALLBACK_CNAME = 'cname.vercel-dns.com';

export type DomainStatus = {
    state: 'active' | 'pending_dns' | 'needs_verification' | 'not_found' | 'error';
    dnsRecords: { type: 'A' | 'CNAME'; name: string; value: string }[];
    verification: { type: string; domain: string; value: string }[];
};

function headers(): Record<string, string> {
    return { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` };
}

function teamQs(): string {
    return process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
}

function projectBase(): string {
    return `${API}/v10/projects/${process.env.VERCEL_PROJECT_ID}`;
}

export async function addDomainToProject(domain: string): Promise<{ ok: boolean; errorCode?: string }> {
    const res = await fetch(`${projectBase()}/domains${teamQs()}`, {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: domain }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    const code: string = body?.error?.code ?? `http_${res.status}`;
    // Domain already on this project (e.g. ngkaizhe.com attached manually
    // before this feature shipped) — the end state is what we wanted.
    if (code.startsWith('domain_already_in_use_by_your')) return { ok: true };
    return { ok: false, errorCode: code };
}

export async function getDomainStatus(domain: string): Promise<DomainStatus> {
    const [projRes, cfgRes] = await Promise.all([
        fetch(`${projectBase()}/domains/${domain}${teamQs()}`, { headers: headers(), cache: 'no-store' }),
        fetch(`${API}/v6/domains/${domain}/config${teamQs()}`, { headers: headers(), cache: 'no-store' }),
    ]);
    if (projRes.status === 404) return { state: 'not_found', dnsRecords: [], verification: [] };
    if (!projRes.ok) return { state: 'error', dnsRecords: [], verification: [] };

    const proj = await projRes.json();
    const cfg = cfgRes.ok ? await cfgRes.json() : { misconfigured: true };

    // Apex domains (example.com) need an A record; subdomains a CNAME.
    const labels = domain.split('.');
    const isApex = labels.length === 2;
    const dnsRecords: DomainStatus['dnsRecords'] = isApex
        ? [{ type: 'A', name: '@', value: cfg.recommendedIPv4?.[0] ?? FALLBACK_APEX_A }]
        : [{ type: 'CNAME', name: labels[0], value: cfg.recommendedCNAME?.[0] ?? FALLBACK_CNAME }];

    const verification = (proj.verification ?? []).map(
        (v: { type: string; domain: string; value: string }) => ({
            type: v.type, domain: v.domain, value: v.value,
        }),
    );

    const state: DomainStatus['state'] = !proj.verified
        ? 'needs_verification'
        : cfg.misconfigured
            ? 'pending_dns'
            : 'active';
    return { state, dnsRecords, verification };
}

export async function removeDomainFromProject(domain: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${projectBase()}/domains/${domain}${teamQs()}`, {
        method: 'DELETE',
        headers: headers(),
    });
    // 404 = already detached; that's the state we want.
    return { ok: res.ok || res.status === 404 };
}
