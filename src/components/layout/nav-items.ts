export interface NavItem {
    href: string;
    label: string;
    labelAr: string;
    icon: string;
    roles: string[];
}

export const NAV_ITEMS: NavItem[] = [
    // Admin
    { href: "/admin", label: "Tableau de bord", labelAr: "لوحة القيادة", icon: "🏠", roles: ["ADMIN"] },
    { href: "/admin/users", label: "Utilisateurs", labelAr: "المستخدمون", icon: "👥", roles: ["ADMIN"] },
    { href: "/admin/groups", label: "Groupes", labelAr: "المجموعات", icon: "📁", roles: ["ADMIN"] },
    { href: "/admin/announcements", label: "Annonces", labelAr: "الإعلانات", icon: "📢", roles: ["ADMIN"] },
    { href: "/admin/reports", label: "Rapports", labelAr: "التقارير", icon: "📊", roles: ["ADMIN"] },
    { href: "/admin/settings", label: "Paramètres", labelAr: "الإعدادات", icon: "⚙️", roles: ["ADMIN"] },

    // Teacher
    { href: "/teacher", label: "Tableau de bord", labelAr: "لوحة القيادة", icon: "🏠", roles: ["TEACHER"] },
    { href: "/teacher/students", label: "Élèves", labelAr: "الطلاب", icon: "🎓", roles: ["TEACHER"] },
    { href: "/teacher/evaluations", label: "Évaluations", labelAr: "التقييمات", icon: "✅", roles: ["TEACHER"] },
    { href: "/teacher/attendance", label: "Présences", labelAr: "الحضور", icon: "📋", roles: ["TEACHER"] },
    { href: "/teacher/groups", label: "Groupes", labelAr: "المجموعات", icon: "📚", roles: ["TEACHER"] },
    { href: "/teacher/announcements", label: "Annonces", labelAr: "الإعلانات", icon: "📢", roles: ["TEACHER"] },

    // Student
    { href: "/student", label: "Tableau de bord", labelAr: "لوحة القيادة", icon: "🏠", roles: ["STUDENT"] },
    { href: "/student/progress", label: "Progression", labelAr: "تقدمي", icon: "📊", roles: ["STUDENT"] },
    { href: "/student/badges", label: "Badges", labelAr: "شاراتي", icon: "🏆", roles: ["STUDENT"] },
    { href: "/student/recitation", label: "Récitation", labelAr: "التسميع", icon: "🎙️", roles: ["STUDENT"] },
    { href: "/student/profile", label: "Profil", labelAr: "ملفي", icon: "👤", roles: ["STUDENT"] },

    // Parent
    { href: "/parent", label: "Tableau de bord", labelAr: "لوحة القيادة", icon: "🏠", roles: ["PARENT"] },
    { href: "/parent/children", label: "Mes enfants", labelAr: "أبنائي", icon: "👥", roles: ["PARENT"] },
    { href: "/parent/progress", label: "Progression", labelAr: "التقدم", icon: "📊", roles: ["PARENT"] },
    { href: "/parent/announcements", label: "Annonces", labelAr: "الإعلانات", icon: "📢", roles: ["PARENT"] },
];
