"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTeacherGroups, getGroupDetails } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

// Translation function
function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        fr: {
            title: "Mes groupes",
            description: "Gérer vos groupes d'élèves",
            students: "élèves",
            nextSession: "Prochaine session",
            viewDetails: "Voir détails",
            noGroups: "Aucun groupe trouvé",
            close: "Fermer",
            studentList: "Liste des élèves",
            studentName: "Nom de l'élève",
            progress: "Progression",
            surah: "Surah",
            noProgress: "Pas de progression",
            level: "Niveau",
            beginner: "Débutant",
            intermediate: "Intermédiaire",
            advanced: "Avancé",
        },
        ar: {
            title: "مجموعاتي",
            description: "إدارة مجموعات طلابك",
            students: "طلاب",
            nextSession: "الجلسة القادمة",
            viewDetails: "عرض التفاصيل",
            noGroups: "لم يتم العثور على مجموعات",
            close: "إغلاق",
            studentList: "قائمة الطلاب",
            studentName: "اسم الطالب",
            progress: "التقدم",
            surah: "سورة",
            noProgress: "لا يوجد تقدم",
            level: "المستوى",
            beginner: "مبتدئ",
            intermediate: "متوسط",
            advanced: "متقدم",
        },
    };
    return translations[locale] || translations.fr;
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    studentCount: number;
    nextSession: Date | null;
}

interface GroupDetails extends Group {
    students: Array<{
        id: string;
        user: {
            name: string | null;
            image: string | null;
        };
        progress: {
            surahName: string | null;
            percentage: number | null;
        } | null;
    }>;
}

function GroupsContent() {
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const locale = searchParams.get("locale") || "fr";
    const t = getTranslations(locale);

    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<GroupDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        async function fetchGroups() {
            try {
                const teacherId = session?.user?.id || "teacher-1";
                const groupsData = await getTeacherGroups(teacherId);
                setGroups(groupsData);
            } catch (error) {
                console.error("Error fetching groups:", error);
            } finally {
                setLoading(false);
            }
        }

        if (session?.user) {
            fetchGroups();
        }
    }, [session]);

    const handleViewDetails = async (groupId: string) => {
        setDetailsLoading(true);
        setShowModal(true);
        try {
            const details = await getGroupDetails(groupId, true);
            setSelectedGroup(details as GroupDetails | null);
        } catch (error) {
            console.error("Error fetching group details:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-muted-foreground">{t.description}</p>
            </div>

            {/* Groups Grid */}
            {groups.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{t.noGroups}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                        <Card key={group.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{group.name}</CardTitle>
                                    <Badge variant="outline">
                                        {locale === "ar" ? t.intermediate : t.intermediate}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {locale === "ar" ? t.students : t.students}
                                        </span>
                                        <span className="font-medium">{group.studentCount}</span>
                                    </div>

                                    {group.nextSession && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {locale === "ar" ? t.nextSession : t.nextSession}
                                            </span>
                                            <span className="font-medium">
                                                {new Date(group.nextSession).toLocaleDateString(
                                                    locale === "ar" ? "ar-SA" : "fr-FR"
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => handleViewDetails(group.id)}
                                    >
                                        {t.viewDetails}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Group Details Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedGroup?.name || t.viewDetails}
                        </DialogTitle>
                    </DialogHeader>

                    {detailsLoading ? (
                        <Skeleton className="h-40" />
                    ) : selectedGroup ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">{selectedGroup.name}</h3>
                                    {selectedGroup.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {selectedGroup.description}
                                        </p>
                                    )}
                                </div>
                                <Badge variant="outline">
                                    {selectedGroup.studentCount} {locale === "ar" ? t.students : t.students}
                                </Badge>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3">{t.studentList}</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {selectedGroup.students.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={student.user.image || ""} />
                                                    <AvatarFallback>
                                                        {student.user.name?.charAt(0) || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{student.user.name}</span>
                                            </div>
                                            <div className="text-right">
                                                {student.progress ? (
                                                    <>
                                                        <p className="text-sm">{student.progress.surahName}</p>
                                                        <Progress
                                                            value={student.progress.percentage}
                                                            className="h-2 w-20"
                                                        />
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        {t.noProgress}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>
                            {t.close}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function TeacherGroupsPage() {
    return (
        <Suspense fallback={
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        }>
            <GroupsContent />
        </Suspense>
    );
}
