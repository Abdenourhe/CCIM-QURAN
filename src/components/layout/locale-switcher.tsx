"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export function LocaleSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const switchLocale = (newLocale: string) => {
        // Replace the locale segment in the pathname
        const segments = pathname.split("/");
        segments[1] = newLocale;
        router.push(segments.join("/"));
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => switchLocale("fr")}
                className={`text-xs px-2 py-1 rounded ${locale === "fr"
                        ? "bg-primary-700 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                FR
            </button>
            <button
                onClick={() => switchLocale("ar")}
                className={`text-xs px-2 py-1 rounded ${locale === "ar"
                        ? "bg-primary-700 text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                AR
            </button>
        </div>
    );
}
