# 🚀 Next.js Modern Template

Template Next.js 15 complet avec authentification, base de données et déploiement multi-environnements intégré.

## 📖 Documentation complète

➡️ **[Guide d'utilisation détaillé](docs/TEMPLATE_GUIDE.md)** - Guide complet de 50+ pages avec tout ce qu'il faut savoir

➡️ **[Guide de déploiement](DEPLOYMENT.md)** - Configuration avec deployment_tools

## 🚀 Features

- ⚡ **Next.js 15** with App Router and Turbopack
- 🔐 **NextAuth.js v5** - Complete authentication system
- 🎨 **Tailwind CSS 4** - Modern styling with CSS variables
- 🧱 **Shadcn/ui** - Beautiful UI components
- 🗄️ **Prisma** - Type-safe database ORM
- 📦 **Semantic Release** - Automated versioning and releases
- 🔧 **TypeScript** - Full type safety
- 🎯 **ESLint** - Code linting
- 🚀 **GitHub Actions** - CI/CD pipeline

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/auth/        # NextAuth.js API routes
│   ├── auth/signin/     # Authentication pages
│   └── dashboard/       # Protected pages
├── components/
│   ├── ui/             # Shadcn/ui components
│   ├── auth/           # Authentication components
│   ├── theme/          # Theme components
│   └── providers/      # React providers
├── lib/
│   ├── auth.ts         # NextAuth.js configuration
│   ├── db.ts          # Prisma client
│   └── env.ts         # Environment validation
├── hooks/              # Custom React hooks
├── types/              # TypeScript types
└── constants/          # App constants
```

## 🛠️ Setup

1. **Clone and install dependencies**
```bash
git clone <your-repo>
cd nextjs-template
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env.local
```

Fill in your database URL and OAuth credentials:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
GITHUB_CLIENT_ID="your-github-id"
GITHUB_CLIENT_SECRET="your-github-secret"
```

3. **Setup database**
```bash
npx prisma generate
npx prisma db push
```

4. **Run development server**
```bash
npm run dev
```

## 🔐 Authentication

- Pre-configured NextAuth.js with GitHub and Google providers
- Database sessions with Prisma
- Protected routes with middleware
- User menu and sign-in components

## 🎨 Theming

- Light/Dark mode with system preference
- CSS custom properties for easy customization
- Responsive design system
- Modern animations and transitions

## 🚀 Deployment

### GitHub Actions CI/CD
The template includes GitHub Actions for:
- Automated testing and linting
- Semantic versioning with conventional commits
- Automated releases with build artifacts

### Multi-Environment PM2 Deployment

The project supports deployment to multiple environments using PM2:

#### Environment Configuration
- **scratch** (development): Port 3000, NODE_ENV=development
- **staging** (pre-production): Port 3001, NODE_ENV=production  
- **stable** (production): Port 3002, NODE_ENV=production

#### Directory Structure
```bash
/home/buarac/app/
├── nextjs-dev/      # Development environment
├── nextjs-staging/  # Staging environment
└── nextjs-stable/   # Production environment
```

#### Deployment Commands

**1. Download and deploy specific version:**
```bash
# Deploy to staging
./scripts/deploy.sh v1.2.3

# Deploy to custom directory with environment
APP_NAME=nextjs-staging APP_CWD=/home/buarac/app/nextjs-staging ./scripts/deploy.sh v1.2.3
```

**2. Start applications with deployment_tools:**
```bash
# Les outils de déploiement ont été migrés vers deployment_tools
# Voir DEPLOYMENT.md pour les nouvelles commandes

# Development
../deployment_tools/scripts/dev-start.sh

# Staging  
../deployment_tools/scripts/staging-deploy.sh v1.x.x

# Production
../deployment_tools/scripts/prod-deploy.sh v1.x.x
```

#### Environment Variables

**System Variables:**
- `APP_NAME`: PM2 application name
- `APP_CWD`: Application working directory
- `APP_VERSION`: Application version (displayed in pm2 list)

**Database Configuration:**
- `SCRATCH_DATABASE_URL`: Development database
- `STAGING_DATABASE_URL`: Staging database  
- `STABLE_DATABASE_URL`: Production database

**Environment Files:**
Each environment can have its own `.env.production` file for secrets:
```env
DATABASE_URL=postgresql://user:pass@localhost/db_name
NEXTAUTH_SECRET=your-secret-key
GITHUB_CLIENT_SECRET=your-oauth-secret
```

#### PM2 Management Commands
```bash
# List all applications
pm2 list

# View logs
pm2 logs nextjs-staging

# Restart application
pm2 restart nextjs-staging

# Stop application  
pm2 stop nextjs-staging

# Delete application
pm2 delete nextjs-staging

# Monitoring dashboard
pm2 monit
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Make your changes
2. Follow conventional commits: `feat:`, `fix:`, `chore:`
3. Push to trigger automated release

## 📄 License

MIT
