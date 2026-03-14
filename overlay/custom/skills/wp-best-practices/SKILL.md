---
name: wp-best-practices
description: WordPress development best practices (2025-2026). Invoke when building WordPress themes, plugins, WooCommerce stores, Gutenberg blocks, FSE block themes, or optimizing WordPress performance, security, and Core Web Vitals. Covers Bedrock architecture, Composer workflows, theme.json v3, block patterns, caching strategy, managed hosting, CI/CD, and WP-CLI automation.
---

# WordPress Best Practices (2025-2026)

When working on any WordPress project, follow these modern standards. Apply relevant sections based on the task at hand.

---

## 1. Architecture & Project Structure

**Use Bedrock (Roots) as the default WordPress project scaffold.** It restructures WordPress into a proper application layout with Composer dependency management and environment-based configuration.

### Directory Structure

```
project-root/
├── config/
│   ├── application.php      # Base config (shared across envs)
│   ├── environments/
│   │   ├── development.php
│   │   ├── staging.php
│   │   └── production.php
├── web/
│   ├── app/                  # wp-content equivalent
│   │   ├── mu-plugins/       # Must-use plugins
│   │   ├── plugins/          # Composer-managed
│   │   ├── themes/
│   │   └── uploads/
│   ├── wp/                   # WordPress core (Composer-managed, gitignored)
│   ├── index.php
│   └── wp-config.php         # Loads Bedrock config
├── vendor/                   # Composer dependencies
├── composer.json
├── .env                      # Environment config (gitignored)
├── .env.example              # Template for .env
└── .gitignore
```

### composer.json (Key Parts)

```json
{
  "type": "project",
  "require": {
    "php": ">=8.1",
    "roots/bedrock-autoloader": "^1.0",
    "roots/wordpress": "^6.7",
    "roots/wp-config": "^1.0",
    "roots/wp-password-bcrypt": "^1.1",
    "wpackagist-plugin/wp-rocket": "^3.17",
    "wpackagist-plugin/safe-svg": "^2.2"
  },
  "repositories": [
    {
      "type": "composer",
      "url": "https://wpackagist.org",
      "only": ["wpackagist-plugin/*", "wpackagist-theme/*"]
    }
  ],
  "extra": {
    "installer-paths": {
      "web/app/mu-plugins/{$name}/": ["type:wordpress-muplugin"],
      "web/app/plugins/{$name}/": ["type:wordpress-plugin"],
      "web/app/themes/{$name}/": ["type:wordpress-theme"]
    },
    "wordpress-install-dir": "web/wp"
  }
}
```

### .env Example

```env
DB_NAME='wordpress'
DB_USER='root'
DB_PASSWORD=''
DB_HOST='127.0.0.1'

WP_ENV='development'
WP_HOME='https://example.test'
WP_SITEURL="${WP_HOME}/wp"

# Generate at https://roots.io/salts.html
AUTH_KEY='generateme'
SECURE_AUTH_KEY='generateme'
LOGGED_IN_KEY='generateme'
NONCE_KEY='generateme'
AUTH_SALT='generateme'
SECURE_AUTH_SALT='generateme'
LOGGED_IN_SALT='generateme'
NONCE_SALT='generateme'
```

### Key Principles

- WordPress core, plugins, and themes are **Composer dependencies** -- never commit them to Git
- Configuration is **environment-specific** via `.env` files
- All code changes flow through **Git + PRs**, not FTP or dashboard edits
- Use `roots/wp-password-bcrypt` for secure password hashing
- Keep `uploads/` gitignored; sync media separately

---

## 2. Theme Strategy: Block-First

**Default to FSE block themes.** Templates, headers, footers, and content areas are all blocks editable in the Site Editor.

### Minimal Block Theme Structure

```
theme-name/
├── style.css                 # Theme header only
├── theme.json                # Design tokens + block config
├── templates/
│   ├── index.html            # Required fallback
│   ├── single.html
│   ├── page.html
│   ├── archive.html
│   ├── 404.html
│   └── home.html
├── parts/
│   ├── header.html
│   ├── footer.html
│   └── sidebar.html
├── patterns/
│   ├── hero.php
│   ├── cta.php
│   └── testimonials.php
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── functions.php             # Minimal -- enqueues + pattern registration
```

### theme.json v3 (WP 6.6+)

```json
{
  "$schema": "https://schemas.wp.org/wp/6.7/theme.json",
  "version": 3,
  "settings": {
    "appearanceTools": true,
    "color": {
      "palette": [
        { "slug": "primary", "color": "#1a3d5c", "name": "Primary" },
        { "slug": "secondary", "color": "#e8491d", "name": "Secondary" },
        { "slug": "light", "color": "#f4f4f4", "name": "Light" },
        { "slug": "dark", "color": "#1c1c1c", "name": "Dark" }
      ],
      "custom": false,
      "defaultPalette": false
    },
    "typography": {
      "fluid": true,
      "fontFamilies": [
        {
          "fontFamily": "Inter, system-ui, sans-serif",
          "slug": "body",
          "name": "Body"
        },
        {
          "fontFamily": "'DM Serif Display', Georgia, serif",
          "slug": "heading",
          "name": "Heading"
        }
      ],
      "fontSizes": [
        { "slug": "small", "size": "0.875rem", "name": "Small", "fluid": { "min": "0.8rem", "max": "0.875rem" } },
        { "slug": "medium", "size": "1rem", "name": "Medium" },
        { "slug": "large", "size": "1.5rem", "name": "Large", "fluid": { "min": "1.25rem", "max": "1.5rem" } },
        { "slug": "x-large", "size": "2.25rem", "name": "Extra Large", "fluid": { "min": "1.75rem", "max": "2.25rem" } }
      ],
      "customFontSize": false
    },
    "spacing": {
      "units": ["px", "rem", "%", "vw"],
      "spacingSizes": [
        { "slug": "10", "size": "0.25rem", "name": "Tiny" },
        { "slug": "20", "size": "0.5rem", "name": "Small" },
        { "slug": "30", "size": "1rem", "name": "Medium" },
        { "slug": "40", "size": "2rem", "name": "Large" },
        { "slug": "50", "size": "4rem", "name": "Extra Large" }
      ]
    },
    "layout": {
      "contentSize": "720px",
      "wideSize": "1200px"
    },
    "blocks": {
      "core/button": {
        "border": { "radius": true }
      },
      "core/paragraph": {
        "typography": { "lineHeight": true }
      }
    }
  },
  "styles": {
    "color": {
      "background": "var(--wp--preset--color--light)",
      "text": "var(--wp--preset--color--dark)"
    },
    "typography": {
      "fontFamily": "var(--wp--preset--font-family--body)",
      "fontSize": "var(--wp--preset--font-size--medium)",
      "lineHeight": "1.6"
    },
    "elements": {
      "heading": {
        "typography": {
          "fontFamily": "var(--wp--preset--font-family--heading)",
          "fontWeight": "700"
        }
      },
      "link": {
        "color": { "text": "var(--wp--preset--color--primary)" },
        ":hover": {
          "color": { "text": "var(--wp--preset--color--secondary)" }
        }
      }
    },
    "blocks": {
      "core/button": {
        "color": {
          "background": "var(--wp--preset--color--primary)",
          "text": "#ffffff"
        },
        "border": { "radius": "4px" }
      }
    }
  }
}
```

### Block Pattern Registration

```php
// patterns/hero.php
<?php
/**
 * Title: Hero Section
 * Slug: theme-name/hero
 * Categories: featured
 * Keywords: hero, banner, header
 * Block Types: core/template-part/header
 */
?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"backgroundColor":"primary","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-primary-background-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">
  <!-- wp:heading {"textAlign":"center","textColor":"light","fontSize":"x-large"} -->
  <h2 class="wp-block-heading has-text-align-center has-light-color has-text-color has-x-large-font-size">Your Headline Here</h2>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","textColor":"light"} -->
  <p class="has-text-align-center has-light-color has-text-color">Supporting text for your hero section.</p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"secondary"} -->
    <div class="wp-block-button"><a class="wp-block-button__link has-secondary-background-color has-background wp-element-button">Get Started</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</div>
<!-- /wp:group -->
```

### functions.php (Minimal)

```php
<?php
declare(strict_types=1);

// Enqueue front-end assets
add_action('wp_enqueue_scripts', function (): void {
    $theme_uri = get_template_directory_uri();
    $theme_dir = get_template_directory();

    wp_enqueue_style(
        'theme-style',
        $theme_uri . '/assets/css/style.css',
        [],
        filemtime($theme_dir . '/assets/css/style.css')
    );
});

// Register block pattern categories
add_action('init', function (): void {
    register_block_pattern_category('theme-name', [
        'label' => __('Theme Name', 'theme-name'),
    ]);
});

// Register block styles
add_action('init', function (): void {
    register_block_style('core/button', [
        'name'  => 'outline-primary',
        'label' => __('Outline Primary', 'theme-name'),
    ]);
});
```

### When to Use Sage/Timber

Use **Sage** (Roots) when the team has Laravel/PHP experience and wants:
- Blade templating with strict separation of concerns
- Tailwind CSS with Vite/Bud HMR
- Automatic `theme.json` generation from Tailwind config
- Controller-based data injection into views

Use **Timber** when you want Twig templating without the full Sage build toolchain.

**Default to plain block themes** for most marketing/content sites. Use Sage for bespoke, developer-heavy projects.

---

## 3. Performance & Core Web Vitals

### Script/Style Enqueuing with Defer/Async

```php
// Defer non-critical scripts
add_filter('script_loader_tag', function (string $tag, string $handle): string {
    $defer_handles = ['theme-scripts', 'analytics', 'custom-interactions'];

    if (in_array($handle, $defer_handles, true)) {
        return str_replace(' src', ' defer src', $tag);
    }
    return $tag;
}, 10, 2);

// Async specific scripts
add_filter('script_loader_tag', function (string $tag, string $handle): string {
    if ($handle === 'third-party-widget') {
        return str_replace(' src', ' async src', $tag);
    }
    return $tag;
}, 10, 2);
```

### Critical CSS Inlining

```php
add_action('wp_head', function (): void {
    $critical_css_path = get_template_directory() . '/assets/css/critical.css';
    if (file_exists($critical_css_path)) {
        echo '<style id="critical-css">' . file_get_contents($critical_css_path) . '</style>';
    }
}, 1);

// Defer main stylesheet
add_filter('style_loader_tag', function (string $tag, string $handle): string {
    if ($handle === 'theme-style') {
        return str_replace(
            "rel='stylesheet'",
            "rel='preload' as='style' onload=\"this.onload=null;this.rel='stylesheet'\"",
            $tag
        );
    }
    return $tag;
}, 10, 2);
```

### Image Optimization

```php
// Add fetchpriority to LCP image
add_filter('wp_get_attachment_image_attributes', function (array $attr, WP_Post $attachment, $size): array {
    if (is_singular() && in_the_loop() && $GLOBALS['wp_query']->current_post === 0) {
        $attr['fetchpriority'] = 'high';
        $attr['loading'] = 'eager';  // Override default lazy for LCP
    }
    return $attr;
}, 10, 3);

// Ensure all images have dimensions to prevent CLS
add_filter('the_content', function (string $content): string {
    return preg_replace_callback('/<img(?![^>]*\bwidth\b)[^>]*>/i', function ($matches) {
        // Add width/height from natural dimensions or skip
        return $matches[0];
    }, $content);
});
```

### Performance Checklist

- **Host**: Managed WordPress hosting (Kinsta, Rocket.net, HostWP, WP Engine) with edge caching, HTTP/2+, PHP 8.2+
- **Caching**: Full-page cache (host-level or WP Rocket), object cache (Redis + Object Cache Pro for high-traffic)
- **Images**: WebP/AVIF, responsive `srcset`, lazy loading (except LCP), compression (Smush/Imagify)
- **Assets**: Minify CSS/JS, defer non-critical JS, inline critical CSS, reduce HTTP requests
- **CDN**: Cloudflare or host-provided CDN for static assets
- **Fonts**: Self-host fonts, use `font-display: swap`, preload critical font files
- **Monitoring**: Regular Lighthouse/PageSpeed Insights audits, WebPageTest for waterfall analysis
- **Plugin discipline**: Audit quarterly, remove unused plugins, avoid overlapping functionality

---

## 4. Content Editing UX

### Design Token Strategy

Use `theme.json` as the **single source of truth** for all design decisions:
- Color palette with semantic naming (primary, secondary, accent -- not blue, red)
- Typography scale with fluid sizes
- Spacing scale for consistent rhythm
- Lock down custom colors/sizes to enforce brand consistency

### Pattern Library Guidelines

- Create patterns for every repeating content structure: hero, CTA, testimonials, pricing, FAQ
- Name patterns clearly: `theme-name/hero-centered`, `theme-name/cta-split`
- Assign patterns to relevant categories and keywords for editor discoverability
- Use `inserter: false` for patterns meant only as template defaults
- Document patterns for content editors

### Editor Guardrails

```json
// In theme.json -- restrict what editors can change
{
  "settings": {
    "color": {
      "custom": false,
      "defaultPalette": false,
      "defaultGradients": false
    },
    "typography": {
      "customFontSize": false,
      "dropCap": false
    },
    "spacing": {
      "customSpacingSize": false
    }
  }
}
```

This limits editors to the defined design system while still providing flexibility through preset options.

---

## 5. Security & Operations

### Security Essentials

- **Updates**: Apply core, theme, and plugin updates in staging first, then promote to production
- **Plugins**: Only use reputable, actively maintained plugins. Never use nulled/pirated extensions
- **Bedrock benefit**: Code directories are not writable at runtime -- prevents filesystem-based exploits
- **Hosting**: Managed hosts provide WAF, DDoS protection, malware scanning, hardened PHP
- **Passwords**: Use `roots/wp-password-bcrypt` for bcrypt hashing (replaces WordPress's default phpass)
- **Headers**: Set security headers (CSP, X-Frame-Options, HSTS) via server config or mu-plugin

### Backup & Recovery

- Daily automated backups (managed hosts include this)
- Test restore procedures regularly
- Keep 30-day backup retention minimum
- Store backups off-site (S3, external backup service)

### Operations Routine

- Weekly: Check for updates, review uptime monitoring
- Monthly: Plugin audit, performance check (Lighthouse), security scan
- Quarterly: Full dependency audit, remove unused plugins/themes, review access permissions

---

## 6. Development Workflow

### Local Development (DDEV)

```bash
# New Bedrock project
composer create-project roots/bedrock my-site
cd my-site

# DDEV setup
ddev config --project-type=wordpress --docroot=web
ddev start

# Generate salts
ddev wp dotenv salts regenerate

# Import database from staging
ddev import-db --file=staging-dump.sql

# Search-replace URLs
ddev wp search-replace 'https://staging.example.com' 'https://my-site.ddev.site'
```

### WP-CLI Essential Commands

```bash
# Core management
wp core update
wp core verify-checksums

# Plugin management
wp plugin list --status=active --format=table
wp plugin install woocommerce --activate
wp plugin deactivate --all
wp plugin update --all

# Database operations
wp db export backup-$(date +%Y%m%d).sql
wp db import dump.sql
wp search-replace 'old-domain.com' 'new-domain.com' --precise --all-tables

# Cache management
wp cache flush
wp transient delete --all

# User management
wp user create editor editor@example.com --role=editor
wp user update 1 --user_pass=newpassword

# Maintenance
wp cron event run --due-now
wp rewrite flush
```

### CI/CD Pipeline Pattern

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'

      - name: Install Composer dependencies
        run: composer install --no-dev --optimize-autoloader

      - name: Build theme assets
        working-directory: web/app/themes/theme-name
        run: |
          npm ci
          npm run build

      - name: Deploy via SSH
        uses: easingthemes/ssh-deploy@v5
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: /var/www/html
          EXCLUDE: ".git, .github, .env, node_modules, tests"
```

### Deployment Script

```bash
#!/usr/bin/env bash
set -euo pipefail

REMOTE_USER="deploy"
REMOTE_HOST="production.example.com"
REMOTE_PATH="/var/www/html"

echo "==> Building assets..."
cd web/app/themes/theme-name
npm ci && npm run build
cd -

echo "==> Installing production deps..."
composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Syncing files..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='node_modules' \
  --exclude='web/app/uploads' \
  ./ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

echo "==> Flushing caches..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_PATH} && wp cache flush && wp rewrite flush"

echo "==> Deployed successfully."
```

---

## 7. Anti-Patterns Checklist

Avoid these common mistakes:

| Anti-Pattern | Why It's Bad | Do Instead |
|---|---|---|
| **FTP-editing production files** | No version control, no rollback, risky | Git + CI/CD deployment |
| **Committing WordPress core to Git** | Bloated repo, merge nightmares | Composer dependency (Bedrock) |
| **30+ active plugins** | Performance drag, conflict risk, maintenance burden | Audit ruthlessly; keep under 15-20 |
| **Heavy multipurpose themes** | Massive CSS/JS bundles, poor CWV | Lean block theme or lightweight starter |
| **Page builder for everything** | DOM bloat, render-blocking CSS/JS, lock-in | FSE block themes + patterns |
| **No caching strategy** | Unnecessary server load, slow TTFB | Full-page + object cache + CDN |
| **Unoptimized images** | Largest cause of poor LCP | WebP/AVIF, compression, lazy loading |
| **Custom colors/fonts everywhere** | Inconsistent brand, unmaintainable | Lock down via `theme.json` |
| **Editing theme files via Dashboard** | Bypasses version control, security risk | Disable file editor; use Git |
| **Ignoring updates** | Security vulnerabilities, compatibility issues | Staging-first update routine |
| **Shared hosting for client sites** | Poor performance, limited security tooling | Managed WordPress hosting |
| **No staging environment** | Changes go straight to production | Staging -> production workflow |
| **Storing secrets in code** | Credentials in Git history | `.env` files (gitignored) |
| **Nulled/pirated plugins** | Malware, no updates, no support | Licensed or open-source alternatives |

---

## WooCommerce-Specific Notes

When working on WooCommerce projects:

- Use **HPOS** (High-Performance Order Storage) -- custom orders table, not post meta
- Enable **object caching** (Redis + Object Cache Pro) for cart/session handling
- Exclude dynamic pages (`/cart/`, `/checkout/`, `/my-account/`) from full-page cache
- Use **Action Scheduler** for background processing (already bundled with Woo)
- Optimize product image sizes: define custom sizes, serve WebP, lazy load galleries
- For headless WooCommerce: use WooCommerce REST API or WPGraphQL + WooGraphQL
- Keep WooCommerce extensions minimal -- every extension adds weight

---

## Quick Reference: Starting a New Project

1. `composer create-project roots/bedrock project-name`
2. Configure `.env` with database credentials and salts
3. Set up DDEV: `ddev config --project-type=wordpress --docroot=web && ddev start`
4. Install theme: `composer require wpackagist-theme/theme-name` or create custom block theme
5. Create `theme.json` v3 with design tokens
6. Build block patterns for repeating content structures
7. Configure CI/CD pipeline (GitHub Actions or host integration)
8. Set up staging environment
9. Run Lighthouse audit, optimize until green CWV scores
10. Deploy to production via Git push
