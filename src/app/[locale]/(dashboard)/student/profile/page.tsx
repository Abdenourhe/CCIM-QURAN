"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    getStudentDashboardStats,
    getStudentBadges,
    updateStudentProfile,
    uploadAvatar,
    changePassword,
    type StudentDashboardStats
} from "@/app/actions/student";
import { useToast } from "@/hooks/use-toast";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            profile: "Profil",
            personalInfo: "Informations personnelles",
            name: "Nom complet",
            email: "Adresse e-mail",
            phone: "Téléphone",
            save: "Enregistrer",
            saving: "Enregistrement...",
            saved: "Enregistré !",
            group: "Groupe",
            teacher: "Enseignant",
            enrolledAt: "Inscrit le",
            statistics: "Statistiques",
            stars: "Étoiles",
            surahsMemorized: "Sourates mémorisées",
            currentStreak: "Série actuelle",
            badges: "Badges gagnés",
            settings: "Paramètres",
            notifications: "Notifications",
            language: "Langue",
            changePassword: "Changer le mot de passe",
            currentPassword: "Mot de passe actuel",
            newPassword: "Nouveau mot de passe",
            confirmPassword: "Confirmer le mot de passe",
            updatePassword: "Mettre à jour",
            accountActivity: "Activité du compte",
            lastLogin: "Dernière connexion",
            sessions: "Sessions actives",
            notificationsEnabled: "Notifications activées",
            emailNotifications: "Notifications par e-mail",
            pushNotifications: "Notifications push",
            success: "Succès",
            error: "Erreur",
            updateSuccess: "Mise à jour réussie",
            updateError: "Erreur lors de la mise à jour",
            noGroup: "Aucun groupe assigné",
            noTeacher: "Aucun enseignant assigné",
        },
        ar: {
            profile: "الملف الشخصي",
            personalInfo: "المعلومات الشخصية",
            name: "الاسم الكامل",
            email: "البريد الإلكتروني",
            phone: "الهاتف",
            save: "حفظ",
            saving: "جارٍ الحفظ...",
            saved: "تم الحفظ!",
            group: "المجموعة",
            teacher: "المعلم",
            enrolledAt: "تاريخ التسجيل",
            statistics: "الإحصائيات",
            stars: "النجوم",
            surahsMemorized: "السور المحفوظة",
            currentStreak: "السلسلة الحالية",
            badges: "الشارات المكتسبة",
            settings: "الإعدادات",
            notifications: "الإشعارات",
            language: "اللغة",
            changePassword: "تغيير كلمة المرور",
            currentPassword: "كلمة المرور الحالية",
            newPassword: "كلمة المرور الجديدة",
            confirmPassword: "تأكيد كلمة المرور",
            updatePassword: "تحديث",
            accountActivity: "نشاط الحساب",
            lastLogin: "آخر تسجيل دخول",
            sessions: "الجلسات النشطة",
            notificationsEnabled: "الإشعارات مفعلة",
            emailNotifications: "إشعارات البريد الإلكتروني",
            pushNotifications: "الإشعارات الفورية",
            success: "نجاح",
            error: "خطأ",
            updateSuccess: "تم التحديث بنجاح",
            updateError: "خطأ في التحديث",
            noGroup: "لم يتم تعيين مجموعة",
            noTeacher: "لم يتم تعيين معلم",
        },
    };
    return translations[locale] || translations.fr;
}

export default function StudentProfilePage() {
    const { data: session, status, update: updateSession } = useSession();
    const locale = useLocale();
    const t = getTranslations(locale);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stats, setStats] = useState<StudentDashboardStats | null>(null);
    const [badgesCount, setBadgesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);

    // Password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        async function fetchData() {
            if (session?.user?.id) {
                try {
                    const [statsData, badges] = await Promise.all([
                        getStudentDashboardStats(session.user.id),
                        getStudentBadges(session.user.id)
                    ]);

                    setStats(statsData);
                    setBadgesCount(badges.filter(b => b.earnedAt).length);
                    setName(session.user.name || "");
                } catch (error) {
                    console.error("Error fetching profile data:", error);
                }
            }
            setLoading(false);
        }

        if (status === "authenticated") {
            fetchData();
        }
    }, [session, status]);

    const handleSaveProfile = async () => {
        if (!session?.user?.id) return;

        setSaving(true);
        try {
            const result = await updateStudentProfile(session.user.id, {
                name: name.trim(),
                phone: phone.trim()
            });

            if (result.success) {
                // Update session
                await updateSession({ name: name.trim() });
                toast({
                    title: t.success,
                    description: t.updateSuccess,
                    variant: "default"
                });
            } else {
                toast({
                    title: t.error,
                    description: t.updateError,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast({
                title: t.error,
                description: t.updateError,
                variant: "destructive"
            });
        }
        setSaving(false);
    };

    const handleAvatarChange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user?.id) return;

        try {
            const result = await uploadAvatar(session.user.id, file);
            if (result.success && result.imageUrl) {
                await updateSession({ image: result.imageUrl });
                toast({
                    title: t.success,
                    description: t.updateSuccess,
                    variant: "default"
                });
            }
        } catch (error) {
            console.error("Error uploading avatar:", error);
            toast({
                title: t.error,
                description: t.updateError,
                variant: "destructive"
            });
        }
    };

    const handlePasswordChange = async () => {
        if (!session?.user?.id) return;

        if (newPassword !== confirmPassword) {
            toast({
                title: t.error,
                description: "Passwords do not match",
                variant: "destructive"
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: t.error,
                description: "Password must be at least 6 characters",
                variant: "destructive"
            });
            return;
        }

        setSaving(true);
        try {
            const result = await changePassword(session.user.id, currentPassword, newPassword);

            if (result.success) {
                toast({
                    title: t.success,
                    description: t.updateSuccess,
                    variant: "default"
                });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast({
                    title: t.error,
                    description: result.message || t.updateError,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error changing password:", error);
            toast({
                title: t.error,
                description: t.updateError,
                variant: "destructive"
            });
        }
        setSaving(false);
    };

    if (loading || status === "loading") {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96 lg:col-span-2" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">👤 {t.profile}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Profile Card */}
                <Card className="lg:row-span-2">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <Avatar className="h-32 w-32 border-4 border-primary">
                                    <AvatarImage src={session?.user?.image || ""} />
                                    <AvatarFallback className="text-4xl bg-primary/20">
                                        {session?.user?.name?.[0] || "S"}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="sm"
                                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    📷
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <h2 className="text-2xl font-bold mt-4">{session?.user?.name || "Student"}</h2>
                            <p className="text-muted-foreground">{session?.user?.email}</p>

                            <div className="mt-6 w-full space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t.group}:</span>
                                    <span className="font-medium">{stats?.rank ? `Group ${stats.rank}` : t.noGroup}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t.enrolledAt}:</span>
                                    <span className="font-medium">
                                        {new Date().toLocaleDateString(locale === "ar" ? "ar-SA" : "fr-FR")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>📊 {t.statistics}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
                                <div className="text-3xl font-bold text-amber-600">⭐</div>
                                <div className="text-2xl font-bold">{stats?.stars || 0}</div>
                                <div className="text-xs text-amber-700">{t.stars}</div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                                <div className="text-3xl font-bold text-emerald-600">📖</div>
                                <div className="text-2xl font-bold">{stats?.surahsMemorized || 0}</div>
                                <div className="text-xs text-emerald-700">{t.surahsMemorized}</div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                                <div className="text-3xl font-bold text-orange-600">🔥</div>
                                <div className="text-2xl font-bold">{stats?.currentStreak || 0}</div>
                                <div className="text-xs text-orange-700">{t.currentStreak}</div>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div className="text-3xl font-bold text-purple-600">🏆</div>
                                <div className="text-2xl font-bold">{badgesCount}</div>
                                <div className="text-xs text-purple-700">{t.badges}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Info */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>👤 {t.personalInfo}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">{t.name}</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">{t.email}</Label>
                                <Input
                                    id="email"
                                    value={session?.user?.email || ""}
                                    disabled
                                    className="mt-1 bg-muted"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">{t.phone}</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+33 6 00 00 00 00"
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="mt-2"
                        >
                            {saving ? t.saving : t.save}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="notifications">
                <TabsList>
                    <TabsTrigger value="notifications">🔔 {t.notifications}</TabsTrigger>
                    <TabsTrigger value="security">🔒 {t.changePassword}</TabsTrigger>
                </TabsList>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t.notifications}</CardTitle>
                            <CardDescription>
                                Gérez vos préférences de notification
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{t.notificationsEnabled}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Recevoir des notifications dans l'application
                                    </p>
                                </div>
                                <Button
                                    variant={notifications ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setNotifications(!notifications)}
                                >
                                    {notifications ? "ON" : "OFF"}
                                </Button>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{t.emailNotifications}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Recevoir des mises à jour par e-mail
                                    </p>
                                </div>
                                <Button
                                    variant={emailNotifications ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                >
                                    {emailNotifications ? "ON" : "OFF"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>🔒 {t.changePassword}</CardTitle>
                            <CardDescription>
                                Mettez à jour votre mot de passe
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="currentPassword">{t.currentPassword}</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="newPassword">{t.newPassword}</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <Button
                                onClick={handlePasswordChange}
                                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                            >
                                {t.updatePassword}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
