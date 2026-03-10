---
title: Use next/image Instead of img in Next.js
impact: HIGH
impactDescription: "Improved LCP, reduced bandwidth, automatic lazy loading"
tags: next.js, images, performance, LCP
---

## Use next/image Instead of img in Next.js

**Impact: HIGH (Improved LCP, reduced bandwidth, automatic lazy loading)**

In Next.js projects, always use the `<Image>` component from `next/image` instead of the native `<img>` tag. The `<Image>` component provides automatic image optimization: lazy loading by default, responsive sizing, format conversion (WebP/AVIF), and on-demand resizing via the Next.js image optimization server. Using `<img>` bypasses all of these optimizations and negatively impacts Largest Contentful Paint (LCP) and bandwidth usage.

**Incorrect (native img tag, no optimization):**

```tsx
// ❌ No lazy loading, no format conversion, no responsive sizing
<img src={user.avatar} alt="Avatar" className="w-14 h-14 object-cover" />
```

**Correct (next/image with explicit dimensions):**

```tsx
import Image from "next/image";

// ✅ Automatic lazy loading, WebP/AVIF conversion, responsive sizing
<Image
  src={user.avatar}
  alt="Avatar"
  width={56}
  height={56}
  className="w-14 h-14 object-cover"
/>
```

**Correct (fill mode for unknown dimensions):**

```tsx
import Image from "next/image";

// ✅ Fill mode for flexible containers
<div className="relative w-full h-48">
  <Image
    src={post.coverImage}
    alt="Cover"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>
```

**Key props to know:**
- `width` / `height`: Required for static sizing (prevents layout shift)
- `fill`: Use when the image should fill its parent container
- `sizes`: Helps the browser pick the right image size for responsive layouts
- `priority`: Set on above-the-fold images (disables lazy loading for LCP images)
- `placeholder="blur"`: Shows a blurred preview while loading

**ESLint enforcement:** Enable `@next/next/no-img-element` (included in `eslint-config-next`) to catch `<img>` usage at lint time.

Reference: [Next.js Image Component Documentation](https://nextjs.org/docs/app/api-reference/components/image)
