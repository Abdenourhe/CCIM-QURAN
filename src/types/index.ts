export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
export type Locale = "fr" | "ar";

export type EvaluationGrade =
    | "EXCELLENT"
    | "GOOD"
    | "AVERAGE"
    | "NEEDS_IMPROVEMENT";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface Surah {
    number: number;
    name: string;
    nameAr: string;
    verses: number;
}

export interface DashboardStats {
    totalStudents?: number;
    totalTeachers?: number;
    totalGroups?: number;
    presentToday?: number;
    averageProgress?: number;
}
