/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--color-page)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        overlay: 'var(--color-overlay)',

        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-faint': 'var(--color-text-faint)',

        border: 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
        'border-timeline': 'var(--color-border-timeline)',

        'btn-primary-bg': 'var(--color-btn-primary-bg)',
        'btn-primary-bg-hover': 'var(--color-btn-primary-bg-hover)',
        'btn-primary-text': 'var(--color-btn-primary-text)',
        'btn-primary-shadow': 'var(--color-btn-primary-shadow)',
        'btn-secondary-bg': 'var(--color-btn-secondary-bg)',
        'btn-secondary-bg-hover': 'var(--color-btn-secondary-bg-hover)',
        'btn-secondary-text': 'var(--color-btn-secondary-text)',

        'badge-bg': 'var(--color-badge-bg)',
        'badge-text': 'var(--color-badge-text)',

        'input-bg': 'var(--color-input-bg)',
        'input-border': 'var(--color-input-border)',
        'input-border-hover': 'var(--color-input-border-hover)',
        'input-text': 'var(--color-input-text)',
        'input-placeholder': 'var(--color-input-placeholder)',

        'header-bg': 'var(--color-header-bg)',
        'header-border': 'var(--color-header-border)',
        'header-text': 'var(--color-header-text)',
        'header-text-hover': 'var(--color-header-text-hover)',

        'form-bg': 'var(--color-form-bg)',
        'form-border': 'var(--color-form-border)',
        'form-section-text': 'var(--color-form-section-text)',
        'form-section-border': 'var(--color-form-section-border)',
        'form-label': 'var(--color-form-label)',
        'form-action-border': 'var(--color-form-action-border)',
        'form-cancel-border': 'var(--color-form-cancel-border)',
        'form-cancel-text': 'var(--color-form-cancel-text)',
        'form-cancel-text-hover': 'var(--color-form-cancel-text-hover)',
        'form-cancel-border-hover': 'var(--color-form-cancel-border-hover)',
      },
    },
  },
  plugins: [],
}
