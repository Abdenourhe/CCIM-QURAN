"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Paramètres",
            description: "Gérer les paramètres du système",
            general: "Général",
            security: "Sécurité",
            notifications: "Notifications",
            data: "Données",
            schoolName: "Nom de l'école",
            contactEmail: "Email de contact",
            timezone: "Fuseau horaire",
            currentPassword: "Mot de passe actuel",
            newPassword: "Nouveau mot de passe",
            confirmPassword: "Confirmer le mot de passe",
            changePassword: "Changer le mot de passe",
            save: "Enregistrer",
            newStudent: "Nouvel étudiant",
            newEvaluation: "Nouvelle évaluation",
            newAnnouncement: "Nouvelle annonce",
            exportData: "Exporter les données",
            clearTestData: "Effacer les données de test",
            exportJSON: "Exporter JSON",
            exportCSV: "Exporter CSV",
            confirmClear: "Êtes-vous sûr ? Cette action est irréversible.",
            success: "Opération réussie",
            error: "Erreur",
        },
        ar: {
            title: "الإعدادات",
            description: "إدارة إعدادات النظام",
            general: "عام",
            security: "الأمان",
            notifications: "الإشعارات",
            data: "البيانات",
            schoolName: "اسم المدرسة",
            contactEmail: "البريد الإلكتروني للتواصل",
            timezone: "المنطقة الزمنية",
            currentPassword: "كلمة المرور الحالية",
            newPassword: "كلمة المرور الجديدة",
            confirmPassword: "تأكيد كلمة المرور",
            changePassword: "تغيير كلمة المرور",
            save: "حفظ",
            newStudent: "طالب جديد",
            newEvaluation: "تقييم جديد",
            newAnnouncement: "إعلان جديد",
            exportData: "تصدير البيانات",
            clearTestData: "مسح بيانات الاختبار",
            exportJSON: "تصدير JSON",
            exportCSV: "تصدير CSV",
            confirmClear: "هل أنت متأكد؟ هذا الإجراء لا رجعة فيه.",
            success: "نجاح",
            error: "خطأ",
        },
    };
    return translations[locale] || translations.fr;
}

type SettingsTab = "general" | "security" | "notifications" | "data";

function SettingsContent() {
    const searchParams = useSearchParams();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const [generalForm, setGeneralForm] = useState({
        schoolName: "AntiGravity Tahfidz",
        contactEmail: "contact@antigravity.com",
        timezone: "Africa/Casablanca",
    });
    const [securityForm, setSecurityForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [notifications, setNotifications] = useState({
        newStudent: true,
        newEvaluation: true,
        newAnnouncement: true,
    });

    const handleGeneralSave = () => {
        // In production, call server action to save
        console.log("Saving general settings:", generalForm);
    };

    const handlePasswordChange = () => {
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        // In production, call server action to change password
        console.log("Changing password");
        setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    };

    const handleExportJSON = () => {
        const data = {
            general: generalForm,
            notifications,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `antigravity_settings_${new Date().toISOString().split("T")[0]}.json`;
        link.click();
    };

    const handleExportCSV = () => {
        const rows = [
            ["Setting", "Value"],
            ["School Name", generalForm.schoolName],
            ["Contact Email", generalForm.contactEmail],
            ["Timezone", generalForm.timezone],
            ["New Student Notifications", notifications.newStudent ? "Enabled" : "Disabled"],
            ["New Evaluation Notifications", notifications.newEvaluation ? "Enabled" : "Disabled"],
            ["New Announcement Notifications", notifications.newAnnouncement ? "Enabled" : "Disabled"],
        ];
        const csvContent = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `antigravity_settings_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
    };

    const handleClearTestData = () => {
        if (confirm(t.confirmClear)) {
            // In production, call server action to clear test data
            console.log("Clearing test data");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground mt-1">{t.description}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2 flex-wrap">
                <Button
                    variant={activeTab === "general" ? "default" : "outline"}
                    onClick={() => setActiveTab("general")}
                >
                    ⚙️ {t.general}
                </Button>
                <Button
                    variant={activeTab === "security" ? "default" : "outline"}
                    onClick={() => setActiveTab("security")}
                >
                    🔒 {t.security}
                </Button>
                <Button
                    variant={activeTab === "notifications" ? "default" : "outline"}
                    onClick={() => setActiveTab("notifications")}
                >
                    🔔 {t.notifications}
                </Button>
                <Button
                    variant={activeTab === "data" ? "default" : "outline"}
                    onClick={() => setActiveTab("data")}
                >
                    💾 {t.data}
                </Button>
            </div>

            {/* Content */}
            {activeTab === "general" && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.general}</CardTitle>
                        <CardDescription>Paramètres généraux de l'application</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.schoolName}</label>
                            <Input
                                value={generalForm.schoolName}
                                onChange={(e: any) => setGeneralForm({ ...generalForm, schoolName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.contactEmail}</label>
                            <Input
                                type="email"
                                value={generalForm.contactEmail}
                                onChange={(e: any) => setGeneralForm({ ...generalForm, contactEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.timezone}</label>
                            <Input
                                value={generalForm.timezone}
                                onChange={(e: any) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleGeneralSave}>{t.save}</Button>
                    </CardContent>
                </Card>
            )}

            {activeTab === "security" && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.security}</CardTitle>
                        <CardDescription>Gérer la sécurité du compte</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.currentPassword}</label>
                            <Input
                                type="password"
                                value={securityForm.currentPassword}
                                onChange={(e: any) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.newPassword}</label>
                            <Input
                                type="password"
                                value={securityForm.newPassword}
                                onChange={(e: any) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.confirmPassword}</label>
                            <Input
                                type="password"
                                value={securityForm.confirmPassword}
                                onChange={(e: any) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                            />
                        </div>
                        <Button onClick={handlePasswordChange}>{t.changePassword}</Button>
                    </CardContent>
                </Card>
            )}

            {activeTab === "notifications" && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.notifications}</CardTitle>
                        <CardDescription>Gérer les notifications par email</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t.newStudent}</p>
                                <p className="text-sm text-muted-foreground">Recevoir un email quand un nouvel étudiant s'inscrit</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.newStudent}
                                onChange={(e: any) => setNotifications({ ...notifications, newStudent: e.target.checked })}
                                className="h-5 w-5"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t.newEvaluation}</p>
                                <p className="text-sm text-muted-foreground">Recevoir un email quand une nouvelle évaluation est soumise</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.newEvaluation}
                                onChange={(e: any) => setNotifications({ ...notifications, newEvaluation: e.target.checked })}
                                className="h-5 w-5"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{t.newAnnouncement}</p>
                                <p className="text-sm text-muted-foreground">Recevoir un email quand une nouvelle annonce est publiée</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={notifications.newAnnouncement}
                                onChange={(e: any) => setNotifications({ ...notifications, newAnnouncement: e.target.checked })}
                                className="h-5 w-5"
                            />
                        </div>
                        <Button>{t.save}</Button>
                    </CardContent>
                </Card>
            )}

            {activeTab === "data" && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t.data}</CardTitle>
                        <CardDescription>Gérer les données du système</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleExportJSON}>
                                📥 {t.exportJSON}
                            </Button>
                            <Button variant="outline" onClick={handleExportCSV}>
                                📊 {t.exportCSV}
                            </Button>
                        </div>
                        <div className="border-t pt-4">
                            <p className="font-medium text-destructive mb-2">{t.clearTestData}</p>
                            <p className="text-sm text-muted-foreground mb-3">
                                Cette action supprimera toutes les données de test de la base de données.
                                Cette action est irréversible.
                            </p>
                            <Button variant="destructive" onClick={handleClearTestData}>
                                🗑️ {t.clearTestData}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
