'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { saveSetup } from './actions';

interface ContactDefaults {
    contactEmail: string;
    linkedin: string;
    github: string;
    website: string;
}

interface Props {
    defaultUsername: string;
    defaultDisplayName: string;
    defaultBio: string;
    defaultResumeSummaryEn: string;
    defaultResumeSummaryZh: string;
    defaultImage: string;
    defaultContact: ContactDefaults;
}

const inputClass = `
    w-full px-4 py-3 rounded-xl
    bg-input-bg border border-input-border
    text-input-text placeholder-input-placeholder
    focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
    outline-none transition-all duration-200
    hover:border-input-border-hover
`;

const labelClass = 'block text-sm font-medium text-form-label mb-2';

export function SetupForm({ defaultUsername, defaultDisplayName, defaultBio, defaultResumeSummaryEn, defaultResumeSummaryZh, defaultImage, defaultContact }: Props) {
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState(defaultUsername);
    const [displayName, setDisplayName] = useState(defaultDisplayName);
    const [bio, setBio] = useState(defaultBio);
    const [resumeSummaryEn, setResumeSummaryEn] = useState(defaultResumeSummaryEn);
    const [resumeSummaryZh, setResumeSummaryZh] = useState(defaultResumeSummaryZh);
    const [image, setImage] = useState(defaultImage);
    const [contactEmail, setContactEmail] = useState(defaultContact.contactEmail);
    const [linkedin, setLinkedin] = useState(defaultContact.linkedin);
    const [github, setGithub] = useState(defaultContact.github);
    const [website, setWebsite] = useState(defaultContact.website);
    const t = useTranslations('Setup');
    const tCommon = useTranslations('Common');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const result = await saveSetup({
                username, displayName, bio, image,
                resumeSummaryEn, resumeSummaryZh,
                contactEmail, linkedin, github, website,
            });
            if (!result.success) {
                setError(result.error ?? 'Something went wrong.');
                return;
            }
            // Hard navigation — useSession().update() doesn't survive the
            // Credentials provider so we can't refresh the JWT in place.
            // The dashboard reads userId for queries (not username), so the
            // JWT can stay username=null without breaking anything.
            window.location.href = '/dashboard';
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-form-bg backdrop-blur-sm p-4 md:p-8 rounded-2xl border border-form-border shadow-2xl"
        >
            <div>
                <label htmlFor="setup-username" className={labelClass}>
                    {t('username')} <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center">
                    <span className="px-3 py-3 text-text-muted bg-input-bg border border-input-border border-r-0 rounded-l-xl font-mono">@</span>
                    <input
                        id="setup-username"
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase())}
                        required
                        autoFocus
                        pattern="[a-z0-9_-]{3,30}"
                        placeholder="kaizhe"
                        className={`${inputClass} rounded-l-none border-l-0 font-mono`}
                    />
                </div>
                <p className="text-xs text-text-faint mt-2">
                    {t('usernameHint')}
                </p>
            </div>

            <div>
                <label htmlFor="setup-display-name" className={labelClass}>
                    {t('displayName')} <span className="text-text-faint">{tCommon('optional')}</span>
                </label>
                <input
                    id="setup-display-name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder=""
                    className={inputClass}
                />
                <p className="text-xs text-text-faint mt-2">{t('displayNameHint')}</p>
            </div>

            <div>
                <label htmlFor="setup-image" className={labelClass}>
                    {t('avatar')} <span className="text-text-faint">{tCommon('optional')}</span>
                </label>
                <div className="flex items-center gap-3">
                    {image && (
                        <img
                            src={image}
                            alt=""
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            className="w-12 h-12 rounded-full object-cover border border-border-light shrink-0"
                        />
                    )}
                    <input
                        id="setup-image"
                        type="url"
                        value={image}
                        onChange={e => setImage(e.target.value)}
                        placeholder="https://github.com/yourname.png"
                        className={inputClass}
                    />
                </div>
                <p className="text-xs text-text-faint mt-2">{t('avatarHint')}</p>
            </div>

            <div>
                <label htmlFor="setup-bio" className={labelClass}>
                    {t('bio')} <span className="text-text-faint">{tCommon('optional')}</span>
                </label>
                <textarea
                    id="setup-bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    maxLength={280}
                    placeholder={t('bioPlaceholder')}
                    className={inputClass}
                />
                <p className="text-xs text-text-faint mt-1">{bio.length} / 280</p>
            </div>

            <fieldset className="border border-form-section-border rounded-xl p-5">
                <legend className="px-2 text-sm font-semibold text-form-section-text">{t('resumeSummaryLegend')}</legend>
                <p className="text-xs text-text-faint mb-4">{t('resumeSummaryHint')}</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="setup-summary-en" className={labelClass}>
                            {t('resumeSummaryEn')} <span className="text-text-faint">{tCommon('optional')}</span>
                        </label>
                        <textarea
                            id="setup-summary-en"
                            value={resumeSummaryEn}
                            onChange={e => setResumeSummaryEn(e.target.value)}
                            rows={3}
                            maxLength={600}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="setup-summary-zh" className={labelClass}>
                            {t('resumeSummaryZh')} <span className="text-text-faint">{tCommon('optional')}</span>
                        </label>
                        <textarea
                            id="setup-summary-zh"
                            value={resumeSummaryZh}
                            onChange={e => setResumeSummaryZh(e.target.value)}
                            rows={3}
                            maxLength={600}
                            className={inputClass}
                        />
                    </div>
                </div>
            </fieldset>

            <fieldset className="border border-form-section-border rounded-xl p-5">
                <legend className="px-2 text-sm font-semibold text-form-section-text">
                    {t('contactSection')}
                </legend>
                <p className="text-xs text-text-faint mb-4">{t('contactHint')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="setup-contact-email" className={labelClass}>{t('contactEmail')}</label>
                        <input
                            id="setup-contact-email"
                            type="email"
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                            placeholder="hi@yourname.dev"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="setup-linkedin" className={labelClass}>{t('linkedin')}</label>
                        <input
                            id="setup-linkedin"
                            type="url"
                            value={linkedin}
                            onChange={e => setLinkedin(e.target.value)}
                            placeholder="https://linkedin.com/in/yourname"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="setup-github" className={labelClass}>{t('github')}</label>
                        <input
                            id="setup-github"
                            type="url"
                            value={github}
                            onChange={e => setGithub(e.target.value)}
                            placeholder="https://github.com/yourname"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor="setup-website" className={labelClass}>{t('website')}</label>
                        <input
                            id="setup-website"
                            type="url"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            placeholder="https://yourname.dev"
                            className={inputClass}
                        />
                    </div>
                </div>
            </fieldset>

            {error && (
                <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-form-action-border">
                <button
                    type="submit"
                    disabled={pending || !username}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
                >
                    {pending ? t('saving') : t('save')}
                </button>
            </div>
        </form>
    );
}
