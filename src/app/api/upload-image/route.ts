import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Sign in to upload images.' }, { status: 401 });
        }

        // Tighter rate limit than the AI endpoints — uploads are heavier on
        // both bandwidth and Blob storage cost. 10/min/user is more than any
        // reasonable UI flow needs.
        const rl = checkRateLimit(rateLimitKey('upload-image', session.user.id), { max: 10, windowSec: 60 });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many uploads. Try again shortly.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
            );
        }

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not configured.' }, { status: 503 });
        }

        // A missing or non-multipart body makes formData() throw — that's a
        // client error, not a server fault.
        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json({ error: 'Expected multipart/form-data body' }, { status: 400 });
        }
        const file = formData.get('file');
        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }
        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: `Unsupported file type ${file.type}. Allowed: ${Array.from(ALLOWED_TYPES).join(', ')}.` },
                { status: 415 },
            );
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_BYTES / 1024 / 1024} MB.` },
                { status: 413 },
            );
        }

        // Namespace each upload under the uploader's id so we can find/delete
        // per-user later without scanning everything. Add a random suffix so
        // re-uploading a file with the same name doesn't overwrite.
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
        const safeName = file.name
            .replace(/\.[^.]+$/, '') // strip extension
            .replace(/[^a-zA-Z0-9_-]/g, '-')
            .substring(0, 60) || 'image';
        const random = Math.random().toString(36).slice(2, 10);
        const key = `entries/${session.user.id}/${Date.now()}-${random}-${safeName}.${ext}`;

        const blob = await put(key, file, {
            access: 'public',
            contentType: file.type,
        });

        return NextResponse.json({
            url: blob.url,
            pathname: blob.pathname,
        });
    } catch (error) {
        console.error('upload-image error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed.' },
            { status: 500 },
        );
    }
}
