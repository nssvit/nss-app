# 🚀 PWA Next.js Template

A modern, production-ready Progressive Web App (PWA) template built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. This template provides a solid foundation for building fast, reliable, and engaging web applications that work offline and can be installed on any device.

## ✨ Features

### 🔥 Core PWA Capabilities
- **🌐 Offline Support** - Works without internet connection using service worker caching
- **📱 App Installation** - Can be installed on mobile devices and desktops
- **🔔 Push Notifications** - Complete push notification system with subscription management
- **⚡ Fast Loading** - Optimized caching strategies for instant loading
- **🔄 Background Sync** - Smart cache updates and data synchronization

### 🎨 Modern Design & UX
- **📱 Mobile-First** - Responsive design with touch-optimized interactions
- **🎯 44px+ Touch Targets** - Accessible button sizes following PWA standards
- **🌈 Beautiful UI** - Clean, modern interface with Tailwind CSS
- **♿ Accessibility** - ARIA labels, semantic HTML, and keyboard navigation
- **🎭 Smooth Animations** - Polished interactions and transitions

### 🛠️ Developer Experience
- **⚡ Next.js 15** - Latest features with App Router and Server Components
- **🔷 TypeScript** - Full type safety and IntelliSense support
- **🎨 Tailwind CSS** - Utility-first CSS framework for rapid development
- **📏 ESLint** - Strict code quality and formatting rules
- **🔧 Production Ready** - Optimized build configuration and security headers

### 🔒 Security & Performance
- **🛡️ Security Headers** - CSP, frame options, and content type protection
- **🚀 Performance Optimized** - Image optimization, code splitting, and caching
- **🔐 Type Safety** - Comprehensive TypeScript implementation
- **📊 PWA Compliance** - Meets all Progressive Web App standards

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone or use this template**
   ```bash
   git clone https://github.com/your-username/pwa-next-app.git
   cd pwa-next-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Testing PWA Features

### 🔧 Development Testing
1. **Install the App**: Look for the install button in your browser's address bar
2. **Test Offline**: Open DevTools → Network → Check "Offline" and refresh
3. **Enable Notifications**: Click "Enable Notifications" and allow permissions
4. **Test on Mobile**: Use Chrome DevTools device emulation or test on actual device

### 🌐 Production Testing
```bash
npm run build
npm start
```

Visit `http://localhost:3000` and test:
- App installation prompt
- Offline functionality
- Push notifications
- Service worker registration

## 🏗️ Project Structure

```
pwa-next-app/
├── public/
│   ├── sw.js                 # Service Worker
│   ├── manifest.json         # PWA Manifest
│   ├── icon-192x192.png      # App Icons
│   └── icon-512x512.png
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root Layout
│   │   ├── page.tsx          # Home Page
│   │   ├── manifest.ts       # Dynamic Manifest
│   │   └── offline/
│   │       └── page.tsx      # Offline Page
│   └── components/
│       ├── PWAManager.tsx           # Install Prompt Manager
│       ├── PWAStatus.tsx            # PWA Status Display
│       └── PushNotificationManager.tsx  # Notification System
├── next.config.ts            # Next.js Configuration
└── tailwind.config.ts        # Tailwind Configuration
```

## 🔧 Configuration

### 🎯 PWA Manifest (`src/app/manifest.ts`)
Customize your app's identity:
```typescript
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Your PWA App Name',
    short_name: 'PWA App',
    description: 'Your app description',
    start_url: '/',
    display: 'standalone',
    theme_color: '#000000',
    // ... more configuration
  }
}
```

### ⚙️ Service Worker (`public/sw.js`)
The service worker provides:
- **Cache-First Strategy** for static assets
- **Network-First Strategy** for dynamic content
- **Stale-While-Revalidate** for images
- **Offline fallbacks** for all content types

### 🔔 Push Notifications
To enable push notifications in production:
1. Get VAPID keys from your push service provider
2. Add environment variables:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   ```

## 📊 PWA Status Component

The template includes a real-time PWA status component that shows:
- **🌐 Connection Status** - Online/Offline indicator
- **📱 Installation Status** - Browser/Installed state
- **🎯 Display Mode** - Standalone/Browser mode
- **⚙️ Service Worker** - Active/Inactive status

## 🎨 Customization

### 🎨 Styling
- Modify `src/app/globals.css` for global styles
- Update `tailwind.config.ts` for theme customization
- Edit component styles using Tailwind utility classes

### 🖼️ Icons and Images
Replace the following files with your app's branding:
- `public/icon-192x192.png`
- `public/icon-512x512.png`
- `public/icon-192x192.svg`
- `public/icon-512x512.svg`

### 🌈 Theming
Update theme colors in:
- `src/app/manifest.ts` - App theme color
- `src/app/layout.tsx` - Meta theme color
- Tailwind configuration for consistent styling

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Other Platforms
```bash
npm run build
npm start
```

The app will be available at `http://localhost:3000`

### 🔍 PWA Testing
After deployment, test your PWA using:
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)
- Chrome DevTools → Lighthouse → PWA

## 📱 PWA Installation

### Mobile (Android/iOS)
1. Open the app in Chrome/Safari
2. Look for "Add to Home Screen" prompt
3. Follow installation instructions

### Desktop (Chrome/Edge)
1. Look for install icon in address bar
2. Click to install as desktop app
3. App appears in start menu/applications

## 🔔 Push Notifications Setup

### Development
```typescript
// Basic test notification (no server required)
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.ready
  registration.showNotification('Test', {
    body: 'This is a test notification',
    icon: '/icon-192x192.png'
  })
}
```

### Production
For production push notifications, you'll need:
1. **VAPID Keys** - For push service authentication
2. **Push Service** - Firebase, OneSignal, or custom server
3. **Subscription Management** - Store user subscriptions

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run build:analyze` - Analyze bundle size

### Database Scripts

- `npm run db:push` - Push schema changes to database
- `npm run db:setup` - Full database setup (schema + RLS + seed data)
- `npm run db:studio` - Open Drizzle Studio (visual database browser)
- `npm run db:lint` - Lint SQL files with Squawk
- `npm run db:diagnose` - Run database diagnostics

---

## 🗄️ Database Setup

This project uses **Drizzle ORM** with **Supabase PostgreSQL**. For full documentation, see [DATABASE_GUIDE.md](./DATABASE_GUIDE.md).

### Prerequisites

1. **Supabase Project** - Create at [supabase.com](https://supabase.com)
2. **Database URL** - Get from Supabase Dashboard → Settings → Database

### Quick Setup

```bash
# 1. Create .env.local with your database URL
echo 'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"' > .env.local

# 2. Run full database setup
npm run db:setup
```

This creates:
- ✅ All tables with indexes and constraints
- ✅ Auth triggers (auto-create volunteer on signup)
- ✅ RLS policies (row-level security)
- ✅ Admin functions
- ✅ Seed data (roles + categories)

### Setting Up Pre-commit Hook (SQL Linting)

Squawk automatically lints SQL files before commits. Set up the hook:

```bash
# Create pre-commit hook in parent repo
cat > ../.git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook for NSS App - Runs Squawk SQL linter

REPO_ROOT="$(git rev-parse --show-toplevel)"
DASHBOARD_DIR="$REPO_ROOT/nss-app-dashboard"

STAGED_SQL=$(git diff --cached --name-only --diff-filter=ACM | grep 'nss-app-dashboard/src/db/migrations/.*\.sql$' || true)

if [ -z "$STAGED_SQL" ]; then
    exit 0
fi

echo "🐘 Running Squawk SQL linter..."

cd "$DASHBOARD_DIR" || exit 1

LINT_FAILED=0
for file in $STAGED_SQL; do
    RELATIVE_FILE="${file#nss-app-dashboard/}"
    if [ -f "$RELATIVE_FILE" ]; then
        echo "Linting: $RELATIVE_FILE"
        npx squawk --exclude=prefer-identity,prefer-bigint-over-int,require-concurrent-index-creation,require-timeout-settings,prefer-robust-stmts,adding-foreign-key-constraint,constraint-missing-not-valid "$RELATIVE_FILE"
        if [ $? -ne 0 ]; then
            LINT_FAILED=1
        fi
    fi
done

if [ $LINT_FAILED -ne 0 ]; then
    echo "❌ SQL lint failed!"
    exit 1
fi

echo "✅ SQL lint passed!"
exit 0
EOF

chmod +x ../.git/hooks/pre-commit
```

### Common Database Tasks

| Task | Command |
|------|---------|
| Add a column | Edit `src/db/schema/*.ts` → `npm run db:push` |
| Add RLS policy | Edit `src/db/migrations/0001_setup.sql` → `npm run db:setup` |
| View database | `npm run db:studio` |
| Check setup | `npm run db:diagnose` |
| Lint SQL | `npm run db:lint` |

### File Structure

```
src/db/
├── schema/                  # TypeScript table definitions
│   ├── volunteers.ts
│   ├── events.ts
│   └── ...
├── migrations/
│   └── 0001_setup.sql       # Auth triggers, RLS, seed data
├── queries.ts               # Database queries
├── validations.ts           # Zod schemas
└── setup.ts                 # Setup script
```

📖 **Full documentation**: [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)

## 🔍 Browser Support

This PWA template supports:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers with PWA support

## 📋 PWA Checklist

This template includes:
- ✅ **Web App Manifest** - App metadata and installation
- ✅ **Service Worker** - Offline functionality and caching
- ✅ **HTTPS Ready** - Secure context for PWA features
- ✅ **Responsive Design** - Works on all screen sizes
- ✅ **Fast Loading** - Optimized performance
- ✅ **App Shell** - Instant loading architecture
- ✅ **Push Notifications** - User engagement
- ✅ **Offline Fallback** - Graceful offline experience

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📖 **Documentation**: Check this README and inline code comments
- 🐛 **Issues**: Report bugs and request features via GitHub Issues
- 💬 **Discussions**: Join the conversation in GitHub Discussions

## 🌟 Acknowledgments

- [Next.js](https://nextjs.org) - The React framework for production
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [PWA Guidelines](https://web.dev/progressive-web-apps/) - Web.dev PWA documentation

---

**Built with ❤️ using Next.js 15, TypeScript, and Tailwind CSS**

Ready to build your next Progressive Web App? 🚀
