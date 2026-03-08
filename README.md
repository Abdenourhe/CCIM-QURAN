# AntiGravity - Gestion d'École de Mémorisation du Coran

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)
![License](https://img.shields.io/badge/License-MIT-green)

A full-stack Quran memorization school management system built with Next.js 14, TypeScript, and Prisma. AntiGravity provides comprehensive management for Quran memorization schools with role-based access for administrators, teachers, students, and parents.

## Features

### 👨‍💼 Admin Dashboard
- User management (create, edit, delete users)
- Group management and scheduling
- Announcements system
- Reports and analytics
- System settings

### 👨‍🏫 Teacher Dashboard
- Student management within assigned groups
- Attendance tracking
- Recitation evaluations
- Group management
- Announcements

### 📚 Student Dashboard
- Personal profile management
- Recitation tracking and practice
- Progress monitoring
- Achievement badges
- View announcements

### 👪 Parent Dashboard
- Monitor children's progress
- View attendance records
- Track evaluations
- View announcements
- Manage children profiles

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL / SQLite (via Prisma ORM)
- **Internationalization**: next-intl (i18n support for French and Arabic)
- **Form Handling**: React Hook Form, Zod validation
- **State Management**: React hooks, Server Actions

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ (or SQLite for development)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd antigravity
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file**
   ```env
   # Database
   DATABASE_URL="file:./dev.db"  # For SQLite
   # Or for PostgreSQL:
   # DATABASE_URL="postgresql://user:password@localhost:5432/antigravity"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

6. **Push database schema**
   ```bash
   npx prisma db push
   ```

7. **Seed the database with sample data**
   ```bash
   npx prisma db seed
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

9. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@antigravity.com | Admin123! |
| Teacher | teacher@antigravity.com | Teacher123! |
| Parent | parent@antigravity.com | Parent123! |
| Student | student@antigravity.com | Student123! |

## Project Structure

```
antigravity/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding
├── src/
│   ├── app/
│   │   ├── [locale]/     # Localized routes
│   │   │   ├── (auth)/   # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/  # Protected dashboard
│   │   │   │   ├── admin/
│   │   │   │   ├── teacher/
│   │   │   │   ├── student/
│   │   │   │   └── parent/
│   │   │   └── page.tsx  # Home page
│   │   ├── api/          # API routes
│   │   │   ├── auth/
│   │   │   ├── announcements/
│   │   │   ├── attendance/
│   │   │   ├── badges/
│   │   │   ├── evaluations/
│   │   │   ├── groups/
│   │   │   ├── progress/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   └── users/
│   │   └── actions/      # Server Actions
│   ├── components/
│   │   ├── auth/         # Auth components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── layout/       # Layout components
│   │   ├── shared/       # Shared components
│   │   └── ui/           # UI components (shadcn)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and configs
│   │   ├── validations/  # Zod schemas
│   │   ├── auth.ts       # NextAuth config
│   │   ├── prisma.ts     # Prisma client
│   │   └── utils.ts      # Utility functions
│   ├── messages/         # i18n translations
│   │   ├── fr.json       # French translations
│   │   └── ar.json       # Arabic translations
│   └── types/            # TypeScript types
├── public/               # Static assets
├── .env.example          # Environment template
├── next.config.ts        # Next.js config
├── tailwind.config.ts   # Tailwind config
└── tsconfig.json         # TypeScript config
```

## Internationalization

AntiGravity supports:
- 🇫🇷 **French** (fr) - Default
- 🇸🇦 **Arabic** (ar) - RTL support

To change the language, use the locale switcher in the header. For Arabic, the interface automatically switches to right-to-left layout.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication

---

<div align="center">
  Made with ❤️ for Quran memorization schools
</div>
