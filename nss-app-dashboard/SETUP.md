# NSS Dashboard Setup Instructions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### 1. Database Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Deploy the Database Schema**
   - In your Supabase dashboard, go to SQL Editor
   - Copy and run the contents of `/db/psql_schema_v5.sql`
   - This will create all tables, functions, and security policies

### 2. Application Setup

1. **Clone and Install**
   ```bash
   cd nss-app-dashboard
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Create an account to get started

## 🔐 Initial Setup

### Creating Your First Admin User

1. **Sign up** through the application interface
2. **In Supabase dashboard**, go to Authentication > Users
3. **Find your user** and copy the User UID
4. **Go to SQL Editor** and run:
   ```sql
   -- Get your volunteer ID
   SELECT id FROM volunteers WHERE auth_user_id = 'your-user-uid-here';

   -- Get admin role ID
   SELECT id FROM role_definitions WHERE role_name = 'admin';

   -- Assign admin role
   INSERT INTO user_roles (volunteer_id, role_definition_id, is_active)
   VALUES ('your-volunteer-id', 'admin-role-id', true);
   ```

### Setting Up Role-Based Access

The system comes with 5 predefined roles:

- **admin**: Full system access
- **program_officer**: Program management and oversight
- **event_lead**: Event management and participation tracking
- **documentation_lead**: Volunteer management and record keeping
- **viewer**: Read-only access for reporting

## 🎯 Features

### ✅ Authentication System
- Email/password sign up and sign in
- User profile management
- Session handling with Supabase Auth

### ✅ Role-Based Access Control
- 5-tier role hierarchy
- Protected routes and components
- Permission-based UI rendering

### ✅ Database Integration
- Full CRUD operations for volunteers and events
- Real-time data synchronization
- Type-safe database queries

### ✅ Volunteer Management
- Comprehensive volunteer profiles
- Academic information tracking
- Profile completeness monitoring

### ✅ Event Management
- Event creation and management
- Participation tracking
- Category-based organization

### ✅ Progressive Web App
- Responsive design for all devices
- Offline capabilities
- App-like user experience

## 🔧 Development

### Database Schema Updates

To update the database schema:
1. Modify `/db/psql_schema_v5.sql`
2. Test locally with a development Supabase project
3. Deploy to production via SQL Editor

### Adding New Features

1. **Database Changes**: Update schema file
2. **Types**: Update `/src/types/database.types.ts`
3. **Hooks**: Create custom hooks in `/src/hooks/`
4. **Components**: Add to `/src/components/`
5. **Routes**: Add to `/src/app/page.tsx`

### Testing

```bash
npm run build  # Test production build
npm run lint   # Check code quality
```

## 🚀 Production Deployment

### Recommended Platforms
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**

### Environment Variables
Ensure these are set in your production environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Security Checklist
- [ ] RLS policies enabled in Supabase
- [ ] Environment variables properly set
- [ ] HTTPS enabled
- [ ] Admin users properly configured

## 📝 Need Help?

1. Check the database schema documentation in `/db/schema.md`
2. Review the main README.md for project overview
3. Check Supabase documentation for auth and database issues
4. Ensure all environment variables are correctly set

## 🎯 Production Readiness

This application is **production-ready** with:
- ✅ Secure authentication
- ✅ Role-based access control
- ✅ Type-safe database operations
- ✅ Responsive PWA design
- ✅ Comprehensive error handling
- ✅ Real-time data synchronization

Simply configure your Supabase project and deploy!