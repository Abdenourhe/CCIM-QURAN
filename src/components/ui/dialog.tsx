"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined);

interface DialogProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function Dialog({ children, open, onOpenChange }: DialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);

    const isControlled = open !== undefined;
    const currentOpen = isControlled ? open : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    return (
        <DialogContext.Provider value={{ open: currentOpen, setOpen }}>
            {children}
        </DialogContext.Provider>
    );
}

function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogTrigger must be used within Dialog");

    if (asChild) {
        // When asChild is true, return the child with the onClick handler
        return React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                    onClick: () => context.setOpen(true),
                });
            }
            return child;
        });
    }

    return (
        <div onClick={() => context.setOpen(true)} className="inline-block">
            {children}
        </div>
    );
}

interface DialogContentProps {
    children: React.ReactNode;
    className?: string;
}

function DialogContent({ children, className }: DialogContentProps) {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogContent must be used within Dialog");

    if (!context.open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => context.setOpen(false)}
            />
            {/* Content */}
            <div
                className={cn(
                    "relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg",
                    className
                )}
            >
                {children}
                <button
                    onClick={() => context.setOpen(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
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
        </div>
    );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
            {...props}
        />
    );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h2
            className={cn("text-lg font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    );
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4",
                className
            )}
            {...props}
        />
    );
}

function DialogClose({ children }: { children?: React.ReactNode }) {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error("DialogClose must be used within Dialog");

    return (
        <button onClick={() => context.setOpen(false)}>
            {children}
        </button>
    );
}

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
};
