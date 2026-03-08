"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { LocaleSwitcher } from "./locale-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Simple icons
const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
);

interface HeaderProps {
    title?: string;
}

export function Header({ title }: HeaderProps) {
    const params = useParams();
    const locale = useLocale();
    const { data: session } = useSession();

    const userName = session?.user?.name || session?.user?.fullName || "User";
    const userRole = session?.user?.role || "STUDENT";

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Get page title from URL if not provided
    const getPageTitle = () => {
        if (title) return title;

        const pathname = window?.location?.pathname || "";
        const segments = pathname.split("/");
        const lastSegment = segments[segments.length - 1];

        // Map common paths to titles
        const titles: Record<string, string> = {
            "admin": locale === "ar" ? "لوحة القيادة" : "Tableau de bord",
            "teacher": locale === "ar" ? "لوحة القيادة" : "Tableau de bord",
            "student": locale === "ar" ? "لوحة القيادة" : "Tableau de bord",
            "parent": locale === "ar" ? "لوحة القيادة" : "Tableau de bord",
            "users": locale === "ar" ? "المستخدمون" : "Utilisateurs",
            "groups": locale === "ar" ? "المجموعات" : "Groupes",
            "announcements": locale === "ar" ? "الإعلانات" : "Annonces",
            "reports": locale === "ar" ? "التقارير" : "Rapports",
            "settings": locale === "ar" ? "الإعدادات" : "Paramètres",
            "students": locale === "ar" ? "الطلاب" : "Élèves",
            "evaluations": locale === "ar" ? "التقييمات" : "Évaluations",
            "attendance": locale === "ar" ? "الحضور" : "Présences",
            "progress": locale === "ar" ? "التقدم" : "Progression",
            "badges": locale === "ar" ? "الشارات" : "Badges",
            "recitation": locale === "ar" ? "التسميع" : "Récitation",
            "profile": locale === "ar" ? "الملف الشخصي" : "Profil",
            "children": locale === "ar" ? "أبنائي" : "Mes enfants",
        };

        return titles[lastSegment] || "AntiGravity";
    };

    return (
        <header className="h-16 border-b bg-background flex items-center justify-between px-6 shrink-0">
            {/* Page Title */}
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">{getPageTitle()}</h2>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center relative">
                <SearchIcon />
                <Input
                    type="search"
                    placeholder={locale === "ar" ? "بحث..." : "Rechercher..."}
                    className="pl-10 w-64 bg-muted border-0"
                />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
                    <BellIcon />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Locale Switcher */}
                <LocaleSwitcher />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 hover:bg-muted rounded-lg p-1 pr-3 transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-medium">{userName}</p>
                                <Badge variant="secondary" className="text-xs">
                                    {userRole}
                                </Badge>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                            <UserIcon />
                            <span className="ml-2">{locale === "ar" ? "الملف الشخصي" : "Profil"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <SettingsIcon />
                            <span className="ml-2">{locale === "ar" ? "الإعدادات" : "Paramètres"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut({ callbackUrl: `/${locale}/login` })}>
                            <LogOutIcon />
                            <span className="ml-2">{locale === "ar" ? "تسجيل الخروج" : "Déconnexion"}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
