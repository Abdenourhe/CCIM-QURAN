"use client";

import { useCurrentUser } from "./use-current-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@/types";

export function useRoleGuard(allowedRoles: Role[]) {
    const { user, isLoading, isAuthenticated } = useCurrentUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            router.push("/fr/login");
            return;
        }
        if (user?.role && !allowedRoles.includes(user.role as Role)) {
            router.push("/fr");
        }
    }, [isLoading, isAuthenticated, user, allowedRoles, router]);

    return { user, isLoading };
}
