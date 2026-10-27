---
name: aos-web
description: AZTEAC (AOS ch. 17) website standards: Next.js, strict TypeScript, Tailwind, performance targets, images, bundle size, Core Web Vitals and the SEO baseline. Use when building or reviewing the public website or any web project.
---

# AOS website development (Chapter 17)

## Stack
- **Next.js** (App Router) by default; **TypeScript is mandatory** with strict mode, `noUncheckedIndexedAccess` and `noImplicitAny` (relaxing needs the Lead Developer and a written reason).
- **Tailwind CSS** for layout, spacing, typography and colour; **CSS Modules** only for complex animations, pseudo-elements and keyframes.
- GSAP for timeline animation, Three.js only when 3D is needed. No library "just in case"; every animation has a purpose.

## Performance (checked before every production deploy)
- Lighthouse **Performance, Accessibility and SEO each above 90**. A drop below blocks the deployment.
- Images: WebP with JPEG fallback, lazy load below the fold, responsive `srcset`, compressed at build (`next/image`).
- JavaScript budget about 250 KB gzipped for the initial page; every dependency justifies its size.
- Core Web Vitals on real mid-range phones: LCP under 2.5 s, FID under 100 ms, CLS under 0.1.

## SEO baseline
- Public pages are **server-side rendered**.
- Every page: unique title (under 60 characters), unique meta description (under 160), Open Graph tags (`og:title`, `og:description`, `og:image`), JSON-LD structured data for the page type (Article, Product, Organization, Event).
- Generated `sitemap.xml` submitted to Google Search Console and Bing; `robots.txt` allows public pages, blocks admin, API and **all of staging**.
- Canonical URL on every page; permanent 301 redirects when URLs change, tested on deploy.

## EcoPlus note
No public website yet. The admin and factory dashboard is Flutter Web in `apps/dashboard` (not started); this skill applies if a marketing site is added later.
