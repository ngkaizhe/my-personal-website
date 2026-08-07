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

function envReady(): boolean {
    return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

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
    // Fail loudly on missing config instead of sending "Bearer undefined" and
    // surfacing an opaque Vercel 403 to the user.
    if (!envReady()) return { ok: false, errorCode: 'vercel_env_missing' };
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
    if (!envReady()) return { state: 'error', dnsRecords: [], verification: [] };
    const [projRes, cfgRes] = await Promise.all([
        fetch(`${projectBase()}/domains/${domain}${teamQs()}`, { headers: headers(), cache: 'no-store' }),
        fetch(`${API}/v6/domains/${domain}/config${teamQs()}`, { headers: headers(), cache: 'no-store' }),
    ]);
    if (projRes.status === 404) return { state: 'not_found', dnsRecords: [], verification: [] };
    if (!projRes.ok) return { state: 'error', dnsRecords: [], verification: [] };

    const proj = await projRes.json();
    const cfg = cfgRes.ok ? await cfgRes.json() : { misconfigured: true };

    // Prefer the record type Vercel itself recommends — it understands
    // multi-label public suffixes (example.co.uk is an apex despite 3 labels).
    // The label-count heuristic is only the fallback when the config endpoint
    // returns neither recommendation.
    const labels = domain.split('.');
    let dnsRecords: DomainStatus['dnsRecords'];
    if (cfg.recommendedIPv4?.length) {
        dnsRecords = [{ type: 'A', name: '@', value: cfg.recommendedIPv4[0] }];
    } else if (cfg.recommendedCNAME?.length) {
        dnsRecords = [{ type: 'CNAME', name: labels[0], value: cfg.recommendedCNAME[0] }];
    } else if (labels.length === 2) {
        dnsRecords = [{ type: 'A', name: '@', value: FALLBACK_APEX_A }];
    } else {
        dnsRecords = [{ type: 'CNAME', name: labels[0], value: FALLBACK_CNAME }];
    }

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
    if (!envReady()) return { ok: false };
    const res = await fetch(`${projectBase()}/domains/${domain}${teamQs()}`, {
        method: 'DELETE',
        headers: headers(),
    });
    // 404 = already detached; that's the state we want.
    return { ok: res.ok || res.status === 404 };
}
