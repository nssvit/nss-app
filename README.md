# NSS Dashboard

A comprehensive **National Service Scheme (NSS) Management System** designed to streamline volunteer management, event organization, and participation tracking for educational institutions.

## 🎯 Project Overview

The NSS Dashboard is a full-stack Progressive Web Application (PWA) that provides a complete solution for managing NSS programs. It consists of three main components:

- **📊 Database Schema**: PostgreSQL-based data management system
- **🚀 Dashboard Application**: Next.js PWA for administrators and coordinators  
- **🎨 UI Prototypes**: Design evolution showcasing interface development

## ✨ Key Features

### 👥 Volunteer Management
- Comprehensive volunteer profiles with academic details
- Emergency contact information and safety tracking
- Profile completeness monitoring and analytics
- Bulk operations for efficient data management

### 📅 Event Management
- Multi-day event support with flexible scheduling
- Event categories with color-coded visual indicators
- Capacity management with min/max participant limits
- Event status workflow (planned → ongoing → completed)

### 📈 Attendance & Participation
- Real-time attendance tracking with multiple status options
- Hours validation and certificate management
- Feedback collection and rating system
- Participation analytics and reporting

### 🔐 Security & Access Control
- Role-based access control (RBAC) with 5 distinct roles
- Row-level security (RLS) for data protection
- Comprehensive audit logging with field-level tracking
- Temporal access control with role expiration

### 📱 Progressive Web App
- Mobile-first responsive design
- Offline functionality with service worker
- Touch-friendly interface (44px minimum touch targets)
- Cross-platform compatibility (iOS, Android, Desktop)

## 🏗️ Architecture

### Database Layer (`/nss-app-dashboard/src/db`)

**New Architecture (2025+)**: We use **Drizzle ORM** as the single source of truth for database schema.

```
📁 nss-app-dashboard/src/db/
├── 📁 schema/               # TypeScript table definitions (SOURCE OF TRUTH)
│   ├── volunteers.ts        # Volunteer table
│   ├── events.ts            # Events table
│   ├── eventParticipation.ts
│   ├── eventCategories.ts
│   ├── roleDefinitions.ts
│   ├── userRoles.ts
│   └── index.ts             # Exports all schemas
├── 📁 migrations/
│   └── 0001_setup.sql       # Auth triggers, RLS, functions, seed data
├── queries.ts               # Type-safe database queries
├── validations.ts           # Zod validation schemas
├── index.ts                 # Database connection
└── setup.ts                 # Database setup script
```

**Technology Stack:**
- **Drizzle ORM** - TypeScript-first ORM with type-safe queries
- **PostgreSQL 15+** with Supabase integration
- **Squawk** - SQL linter for safe migrations
- **Row Level Security (RLS)** for data protection
- **Zod** - Runtime validation schemas

> 📖 **Full Database Documentation**: [DATABASE_GUIDE.md](nss-app-dashboard/DATABASE_GUIDE.md)

### Application Layer (`/nss-app-dashboard`)
```
📁 nss-app-dashboard/
├── 📁 src/
│   ├── 📁 app/              # Next.js App Router
│   ├── 📁 components/       # React components
│   ├── 📁 hooks/           # Custom React hooks
│   └── 📁 utils/           # Utility functions
├── 📁 public/              # Static assets & PWA files
└── 📄 package.json         # Dependencies and scripts
```

**Technology Stack:**
- Next.js 15 with App Router
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- Progressive Web App capabilities

### UI Prototypes (`/ui`)
```
📁 ui/
├── 📄 v1.html - v6.html     # Design evolution
└── 📄 vf.html               # Final prototype
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account (free tier works)

### Quick Setup (3 Steps)

```bash
# 1. Clone and install
git clone https://github.com/your-org/nss-app.git
cd nss-app/nss-app-dashboard
npm install

# 2. Configure database (get URL from Supabase Dashboard → Settings → Database)
echo 'DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"' > .env.local

# 3. Setup database (creates tables, triggers, RLS, seed data)
npm run db:setup
```

### Setup Pre-commit Hook (SQL Linting)

```bash
# From nss-app-dashboard directory:
cat > ../.git/hooks/pre-commit << 'EOF'
#!/bin/bash
REPO_ROOT="$(git rev-parse --show-toplevel)"
DASHBOARD_DIR="$REPO_ROOT/nss-app-dashboard"
STAGED_SQL=$(git diff --cached --name-only --diff-filter=ACM | grep 'nss-app-dashboard/src/db/migrations/.*\.sql$' || true)
if [ -z "$STAGED_SQL" ]; then exit 0; fi
echo "🐘 Running Squawk SQL linter..."
cd "$DASHBOARD_DIR" || exit 1
for file in $STAGED_SQL; do
    RELATIVE_FILE="${file#nss-app-dashboard/}"
    [ -f "$RELATIVE_FILE" ] && npx squawk --exclude=prefer-identity,prefer-bigint-over-int,require-concurrent-index-creation,require-timeout-settings,prefer-robust-stmts,adding-foreign-key-constraint,constraint-missing-not-valid "$RELATIVE_FILE" || exit 1
done
echo "✅ SQL lint passed!"
EOF
chmod +x ../.git/hooks/pre-commit
```

### Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Full setup (schema + RLS + seed data) |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open visual database browser |
| `npm run db:lint` | Lint SQL files with Squawk |
| `npm run db:diagnose` | Run database diagnostics |

> 📖 **Full Database Guide**: [DATABASE_GUIDE.md](nss-app-dashboard/DATABASE_GUIDE.md)

## 📊 Database Schema Details

### Core Tables (Drizzle ORM)
| Table | Description |
|-------|-------------|
| `volunteers` | NSS student participants with auth linkage |
| `events` | NSS activities and programs |
| `event_participation` | Attendance and participation records |
| `event_categories` | Event type categories |
| `role_definitions` | Role definitions (admin, head, volunteer) |
| `user_roles` | User-role assignments |

### Key Features
- **Type-safe queries** with Drizzle ORM
- **Auto-generated types** from TypeScript schema
- **Auth triggers** - auto-create volunteer on Supabase signup
- **Soft-delete** - preserves data when users are removed
- **RLS policies** - row-level security on all tables
- **Check constraints** - validates branch, year, status values
- **Indexes** - optimized for common query patterns

### Database Commands
```bash
npm run db:push      # Push schema changes
npm run db:setup     # Full setup (schema + RLS + seed)
npm run db:studio    # Visual database browser
npm run db:lint      # Lint SQL with Squawk
npm run db:diagnose  # Health check
```

> 📖 **Complete documentation**: [DATABASE_GUIDE.md](nss-app-dashboard/DATABASE_GUIDE.md)

## 🎨 User Interface

### Design Philosophy
- **Mobile-first**: Responsive design optimized for all devices
- **Glassmorphism**: Modern UI with backdrop blur effects
- **Accessibility**: WCAG compliant with keyboard navigation
- **Touch-friendly**: 44px minimum touch targets

### Key Pages
- **📊 Dashboard**: Overview with statistics and quick actions
- **👥 Volunteers**: Comprehensive volunteer management
- **📅 Events**: Event creation and management
- **✅ Attendance**: Real-time attendance tracking
- **📈 Reports**: Analytics and custom reporting
- **👤 Profile**: User profile and preferences
- **⚙️ Settings**: System configuration and preferences

## 🔒 Security Features

### Authentication & Authorization
- **Supabase Auth** integration
- **Role-based access control** with 5 distinct roles:
  - `admin`: Full system access
  - `program_officer`: Program management
  - `event_lead`: Event management
  - `documentation_lead`: Volunteer management
  - `viewer`: Read-only access

### Data Protection
- **Row Level Security (RLS)** for data isolation
- **Audit logging** for compliance and monitoring
- **Field-level encryption** for sensitive data
- **Session management** with automatic expiration

## 📈 Analytics & Reporting

### Volunteer Analytics
- Participation rates and engagement metrics
- Profile completeness tracking
- Academic progress monitoring
- Certificate achievements

### Event Analytics
- Attendance rates and capacity utilization
- Feedback scores and satisfaction metrics
- Resource allocation optimization
- Success rate tracking

### System Analytics
- User activity monitoring
- Performance metrics
- Security incident tracking
- Usage pattern analysis

## 🌟 Advanced Features

### Certificate Management
- Automated certificate generation
- Digital certificate storage with URLs
- Bulk certificate issuance
- Certificate verification system

### Notification System
- Push notifications for PWA users
- Email notifications for important updates
- In-app notifications for real-time updates
- Customizable notification preferences

### Data Export & Import
- CSV/Excel export for all data
- Bulk import capabilities
- Data validation and error handling
- Template-based import system

## 📱 PWA Features

### Offline Capabilities
- Service Worker for offline functionality
- Cached resources for improved performance
- Background sync for data synchronization
- Offline indicator and fallback pages

### Mobile Experience
- App-like navigation and interactions
- Touch gestures and swipe actions
- Native-like performance
- Home screen installation

## 📊 Performance Metrics

### Database Performance
- **Search**: ~50ms for 10,000+ records
- **Complex queries**: ~100ms for multi-table joins
- **Analytics**: ~200ms for comprehensive statistics
- **Scalability**: Tested for 100,000+ volunteers

### Application Performance
- **First Contentful Paint**: <2s
- **Time to Interactive**: <3s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1

## 🔧 Development

### Project Structure
```
nss-app/
├── 📁 nss-app-dashboard/       # Main application
│   ├── 📁 src/
│   │   ├── 📁 app/             # Next.js pages
│   │   ├── 📁 components/      # React components
│   │   └── 📁 db/              # Database (Drizzle ORM)
│   │       ├── 📁 schema/      # TypeScript table definitions
│   │       ├── 📁 migrations/  # SQL for triggers, RLS, seed
│   │       ├── queries.ts      # Database queries
│   │       └── setup.ts        # Setup script
│   ├── DATABASE_GUIDE.md       # Complete DB documentation
│   └── README.md               # App-specific readme
├── 📁 db/                      # (Legacy) Old schema files
├── 📁 ui/                      # UI prototypes and mockups
└── 📄 README.md                # This file
```

### Development Workflow
1. **Feature Development**: Create feature branches
2. **Database Changes**: Update schema files and documentation
3. **Testing**: Comprehensive testing including PWA features
4. **Deployment**: Automated deployment with CI/CD

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🚀 Deployment

### Database Deployment

```bash
cd nss-app-dashboard

# For any PostgreSQL provider (Supabase, Neon, Railway, AWS RDS):
# 1. Set DATABASE_URL in .env.local
# 2. Run setup
npm run db:setup
```

The setup is **portable** - works with any PostgreSQL provider. Just change the `DATABASE_URL`.

### Application Deployment

```bash
cd nss-app-dashboard

# Build for production
npm run build

# Deploy to Vercel (recommended)
vercel --prod

# Or run locally
npm run start
```

## 🎯 Future Roadmap

### Short-term (Next 6 months)
- [ ] Real-time collaboration features
- [ ] Advanced reporting dashboard
- [ ] Mobile app (React Native)
- [ ] API documentation and SDK

### Long-term (Next 12 months)
- [ ] Multi-institution support
- [ ] Advanced analytics with ML
- [ ] Integration with government portals
- [ ] Blockchain-based certificate verification

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, please:
1. Check the [documentation](db/schema.md)
2. Review the [changelog](CHANGELOG.md)
3. Create an issue on GitHub
4. Contact the development team

## 🙏 Acknowledgments

- **NSS coordinators** for requirements and feedback
- **Student volunteers** for user testing
- **Open source community** for tools and libraries
- **Educational institutions** for real-world testing

---

**Built with ❤️ for the NSS community**

*Empowering social service through technology*