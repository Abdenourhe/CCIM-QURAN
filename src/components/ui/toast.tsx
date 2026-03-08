"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Toast, useToast, ToastProvider } from "@/hooks/use-toast";

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const variantStyles = {
        default: "bg-background border",
        success: "bg-green-600 text-white border-green-700",
        error: "bg-red-600 text-white border-red-700",
        warning: "bg-yellow-600 text-white border-yellow-700",
        destructive: "bg-red-600 text-white border-red-700",
    };

    return (
        <div
            className={cn(
                "flex items-start justify-between p-4 rounded-lg shadow-lg min-w-[300px] max-w-md",
                variantStyles[toast.variant || "default"]
            )}
        >
            <div className="flex-1">
                {toast.title && (
                    <p className="font-semibold text-sm">{toast.title}</p>
                )}
                {toast.description && (
                    <p className="text-sm mt-1 opacity-90">{toast.description}</p>
                )}
            </div>
            <button
                onClick={onDismiss}
                className="ml-4 text-current opacity-70 hover:opacity-100"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            </button>
        </div>
    );
}

function Toaster() {
    const { toasts, dismiss } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => dismiss(toast.id)}
                />
            ))}
        </div>
    );
}

export { ToastProvider, Toaster, useToast };
