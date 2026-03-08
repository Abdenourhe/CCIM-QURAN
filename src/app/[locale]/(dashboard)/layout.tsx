"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar, MobileHeader } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <SessionProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Mobile Header */}
                <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div className="flex flex-col flex-1 overflow-hidden lg:pl-64 pt-16 lg:pt-0">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
}
