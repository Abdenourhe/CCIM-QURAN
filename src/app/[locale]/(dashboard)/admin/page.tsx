import { Suspense } from "react";
import { getDashboardStats } from "@/app/actions/admin";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// Translation function for server components
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            welcome: "Bienvenue — Administrateur",
            overview: "Vue d'ensemble du système AntiGravity",
            totalUsers: "Total utilisateurs",
            totalStudents: "Total élèves",
            totalTeachers: "Total enseignants",
            activeGroups: "Groupes actifs",
            announcements: "Annonces",
            students: "Élèves",
            teachers: "Enseignants",
            groups: "Groupes",
            quickActions: "Actions rapides",
            recentActivity: "Activité récente",
            newUsers: "Nouveaux utilisateurs",
            noRecentActivity: "Aucune activité récente",
            noRecentUsers: "Aucun utilisateur récent",
            admin: "Administrateur",
            teacher: "Enseignant",
            student: "Élève",
            parent: "Parent",
        },
        ar: {
            welcome: "أهلاً وسهلاً — المدير",
            overview: "نظام AntiGravity العام",
            totalUsers: "إجمالي المستخدمين",
            totalStudents: "إجمالي الطلاب",
            totalTeachers: "إجمالي المعلمين",
            activeGroups: "المجموعات النشطة",
            announcements: "الإعلانات",
            students: "الطلاب",
            teachers: "المعلمون",
            groups: "المجموعات",
            quickActions: "إجراءات سريعة",
            recentActivity: "النشاط الأخير",
            newUsers: "المستخدمون الجدد",
            noRecentActivity: "لا يوجد نشاط حديث",
            noRecentUsers: "لا يوجد مستخدمون حديثون",
            admin: "مدير",
            teacher: "معلم",
            student: "طالب",
            parent: "ولي أمر",
        },
    };
    return translations[locale] || translations.fr;
}

async function DashboardStats({ locale }: { locale: string }) {
    const t = getTranslations(locale);
    const stats = await getDashboardStats();

    const statsData = [
        {
            title: t.totalUsers,
            value: stats.totalUsers,
            icon: "👥",
            description: "Total utilisateurs enregistrés",
        },
        {
            title: t.totalStudents,
            value: stats.totalStudents,
            icon: "🎓",
            description: t.student,
        },
        {
            title: t.totalTeachers,
            value: stats.totalTeachers,
            icon: "📚",
            description: t.teacher,
        },
        {
            title: t.activeGroups,
            value: stats.totalGroups,
            icon: "📁",
            description: "Groupes créés",
        },
        {
            title: t.announcements,
            value: stats.totalAnnouncements,
            icon: "📢",
            description: "Total annonces",
        },
    ];

    const recentActivities = stats.recentActivity.map((activity: any) => ({
        id: activity.id,
        description: `${activity.action} - ${activity.entity}`,
        time: new Date(activity.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR"),
        type: activity.action,
    }));

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat) => (
                    <StatsCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        description={stat.description}
                    />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="font-semibold mb-4">{t.quickActions}</h3>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/users">
                        <Button variant="outline" size="sm">
                            ➕ {t.groups}
                        </Button>
                    </Link>
                    <Link href="/admin/groups">
                        <Button variant="outline" size="sm">
                            📁 {t.groups}
                        </Button>
                    </Link>
                    <Link href="/admin/announcements">
                        <Button variant="outline" size="sm">
                            📢 {t.announcements}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Recent Activity & New Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <RecentActivity activities={recentActivities} />

                {/* Recent Users */}
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="font-semibold mb-4">{t.newUsers}</h3>
                    {stats.recentUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t.noRecentUsers}</p>
                    ) : (
                        <ul className="space-y-3">
                            {stats.recentUsers.map((user: any) => (
                                <li key={user.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-medium">{user.name || "N/A"}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                                        {t[user.role.toLowerCase()] || user.role}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                ))}
            </div>
            <Skeleton className="h-48" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        </div>
    );
}

interface PageProps {
    params: {
        locale: string;
    };
}

export default function AdminDashboardPage({ params }: PageProps) {
    const t = getTranslations(params.locale);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold">
                    {t.welcome}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t.overview}
                </p>
            </div>

            {/* Dashboard Content */}
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardStats locale={params.locale} />
            </Suspense>
        </div>
    );
}
