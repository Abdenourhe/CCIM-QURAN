"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    getLinkedChildren,
    linkChild,
    unlinkChild,
    type LinkedChild,
} from "@/app/actions/parent";
import { useToast } from "@/hooks/use-toast";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            myChildren: "Mes enfants",
            linkNewChild: "Lier un nouvel enfant",
            enterCode: "Entrer le code de l'enfant",
            link: "Lier",
            cancel: "Annuler",
            linking: "Liaison en cours...",
            unlink: "Délier",
            confirmUnlink: "Êtes-vous sûr de vouloir délier cet enfant ?",
            childCode: "Code de l'enfant",
            status: "Statut",
            active: "Actif",
            needsAttention: "Attention requise",
            group: "Groupe",
            teacher: "Enseignant",
            stars: "Étoiles",
            surahsMemorized: "Sourates mémorisées",
            streak: "Jours consécutifs",
            lastEvaluation: "Dernière évaluation",
            noChildren: "Aucun enfant lié",
            linkFirst: "Liez votre premier enfant pour suivre sa progression",
            viewProgress: "Voir la progression",
            noScore: "Pas encore évalué",
            pendingRequests: "Demandes en attente",
            noRequests: "Aucune demande en attente",
            age: "Âge",
            grade: "Niveau",
            enrolled: "Inscrit le",
        },
        ar: {
            myChildren: "أبنائي",
            linkNewChild: "ربط طفل جديد",
            enterCode: "أدخل كود الطفل",
            link: "ربط",
            cancel: "إلغاء",
            linking: "جاري الربط...",
            unlink: "فك الربط",
            confirmUnlink: "هل أنت متأكد من فك ربط هذا الطفل؟",
            childCode: "كود الطفل",
            status: "الحالة",
            active: "نشط",
            needsAttention: "يحتاج اهتماماً",
            group: "المجموعة",
            teacher: "المعلم",
            stars: "النجوم",
            surahsMemorized: "السور المحفوظة",
            streak: "أيام متتالية",
            lastEvaluation: "آخر تقييم",
            noChildren: "لا يوجد أطفال مرتبطين",
            linkFirst: "اربط أول طفل لتتبع تقدمه",
            viewProgress: "عرض التقدم",
            noScore: "لم يُقيَّم بعد",
            pendingRequests: "الطلبات المعلقة",
            noRequests: "لا توجد طلبات معلقة",
            age: "العمر",
            grade: "المستوى",
            enrolled: "تاريخ التسجيل",
        },
    };
    return translations[locale] || translations.fr;
}

// Status badge component
function StatusBadge({ status }: { status: "ACTIVE" | "NEEDS_ATTENTION" }) {
    const locale = useLocale();
    const t = getTranslations(locale);

    return (
        <Badge className={status === "ACTIVE"
            ? "bg-green-100 text-green-800 hover:bg-green-100"
            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        }>
            {status === "ACTIVE" ? t.active : t.needsAttention}
        </Badge>
    );
}

// Calculate age from date of birth
function calculateAge(dateOfBirth: Date | null): string | null {
    if (!dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return `${age} ans`;
}

// Format date
function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function ParentChildrenPage() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = getTranslations(locale);
    const { toast } = useToast();

    const [children, setChildren] = useState<LinkedChild[]>([]);
    const [loading, setLoading] = useState(true);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [childCode, setChildCode] = useState("");
    const [linking, setLinking] = useState(false);
    const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push(`/${locale}/login`);
            return;
        }

        if (session?.user?.id) {
            loadChildren();
        }
    }, [session, status, locale, router]);

    async function loadChildren() {
        if (!session?.user?.id) return;

        try {
            const data = await getLinkedChildren(session.user.id);
            setChildren(data);
        } catch (error) {
            console.error("Error loading children:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleLinkChild() {
        if (!childCode.trim() || !session?.user?.id) return;

        setLinking(true);
        try {
            const result = await linkChild(session.user.id, childCode);

            if (result.success) {
                toast({
                    title: locale === "ar" ? "تم بنجاح" : "Succès",
                    description: result.message,
                });
                setChildCode("");
                setLinkDialogOpen(false);
                loadChildren();
            } else {
                toast({
                    title: locale === "ar" ? "خطأ" : "Erreur",
                    description: result.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: locale === "ar" ? "خطأ" : "Erreur",
                description: locale === "ar" ? "فشل في ربط الطفل" : "Échec de la liaison",
                variant: "destructive",
            });
        } finally {
            setLinking(false);
        }
    }

    async function handleUnlink(childId: string) {
        if (!session?.user?.id) return;

        setUnlinkingId(childId);
        try {
            const result = await unlinkChild(session.user.id, childId);

            if (result.success) {
                toast({
                    title: locale === "ar" ? "تم بنجاح" : "Succès",
                    description: result.message,
                });
                loadChildren();
            } else {
                toast({
                    title: locale === "ar" ? "خطأ" : "Erreur",
                    description: result.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: locale === "ar" ? "خطأ" : "Erreur",
                description: locale === "ar" ? "فشل في فك الربط" : "Échec de la suppression",
                variant: "destructive",
            });
        } finally {
            setUnlinkingId(null);
        }
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">{t.myChildren}</h1>

                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            ➕ {t.linkNewChild}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t.linkNewChild}</DialogTitle>
                            <DialogDescription>
                                {t.enterCode}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium">
                                    {t.childCode}
                                </label>
                                <Input
                                    value={childCode}
                                    onChange={(e) => setChildCode(e.target.value)}
                                    placeholder={t.childCode}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setLinkDialogOpen(false)}
                                >
                                    {t.cancel}
                                </Button>
                                <Button
                                    onClick={handleLinkChild}
                                    disabled={linking || !childCode.trim()}
                                >
                                    {linking ? t.linking : t.link}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Children Grid */}
            {children.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-6xl mb-4">👶</div>
                        <h2 className="text-xl font-semibold mb-2">{t.noChildren}</h2>
                        <p className="text-muted-foreground mb-4">{t.linkFirst}</p>
                        <Button onClick={() => setLinkDialogOpen(true)}>
                            ➕ {t.linkNewChild}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {children.map((child) => (
                        <Card key={child.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-14 w-14">
                                            <AvatarImage src={child.image || ""} />
                                            <AvatarFallback className="bg-violet-100 text-violet-600 text-lg">
                                                {child.name ? child.name.charAt(0) : "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">
                                                {child.name}
                                            </CardTitle>
                                            {child.dateOfBirth && (
                                                <p className="text-sm text-muted-foreground">
                                                    {calculateAge(child.dateOfBirth)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <StatusBadge status={child.status} />
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Group & Teacher */}
                                <div className="space-y-2">
                                    {child.groupName && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span>📚</span>
                                            <span className="text-muted-foreground">{t.group}:</span>
                                            <span className="font-medium">{child.groupName}</span>
                                        </div>
                                    )}
                                    {child.teacherName && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span>👨‍🏫</span>
                                            <span className="text-muted-foreground">{t.teacher}:</span>
                                            <span className="font-medium">{child.teacherName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-amber-50 rounded-lg p-2">
                                        <div className="text-lg font-bold text-amber-600">⭐ {child.stars}</div>
                                        <div className="text-xs text-amber-600">{t.stars}</div>
                                    </div>
                                    <div className="bg-emerald-50 rounded-lg p-2">
                                        <div className="text-lg font-bold text-emerald-600">{child.surahsMemorized}</div>
                                        <div className="text-xs text-emerald-600">{t.surahsMemorized}</div>
                                    </div>
                                    <div className="bg-violet-50 rounded-lg p-2">
                                        <div className="text-lg font-bold text-violet-600">🔥 {child.currentStreak}</div>
                                        <div className="text-xs text-violet-600">{t.streak}</div>
                                    </div>
                                </div>

                                {/* Last Evaluation */}
                                {child.latestEvaluationScore !== null && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{t.lastEvaluation}:</span>
                                        <Badge variant="outline" className="bg-blue-50">
                                            {child.latestEvaluationScore}%
                                        </Badge>
                                    </div>
                                )}

                                {child.latestEvaluationScore === null && (
                                    <div className="text-sm text-muted-foreground text-center">
                                        {t.noScore}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Link href={`/${locale}/parent/progress?child=${child.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full">
                                            📊 {t.viewProgress}
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleUnlink(child.id)}
                                        disabled={unlinkingId === child.id}
                                        title={t.unlink}
                                    >
                                        🗑️
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
