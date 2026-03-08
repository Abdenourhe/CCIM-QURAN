"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

interface DropdownMenuProps {
    children: React.ReactNode;
}

function DropdownMenu({ children }: DropdownMenuProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block">{children}</div>
        </DropdownMenuContext.Provider>
    );
}

function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
    const context = React.useContext(DropdownMenuContext);
    if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

    return (
        <button
            onClick={() => context.setOpen(!context.open)}
            className="inline-flex items-center justify-center"
        >
            {children}
        </button>
    );
}

interface DropdownMenuContentProps {
    children: React.ReactNode;
    className?: string;
    align?: "start" | "center" | "end";
}

function DropdownMenuContent({ children, className, align = "end" }: DropdownMenuContentProps) {
    const context = React.useContext(DropdownMenuContext);
    if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu");

    if (!context.open) return null;

    const alignClass = {
        start: "left-0",
        center: "left-1/2 -translate-x-1/2",
        end: "right-0",
    };

    return (
        <div
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
                alignClass[align],
                "mt-2",
                className
            )}
        >
            {children}
        </div>
    );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

function DropdownMenuItem({ children, className, ...props }: DropdownMenuItemProps) {
    const context = React.useContext(DropdownMenuContext);
    if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu");

    return (
        <button
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            onClick={() => context.setOpen(false)}
            {...props}
        >
            {children}
        </button>
    );
}

function DropdownMenuSeparator() {
    return <div className="-mx-1 my-1 h-px bg-muted" />;
}

function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
            {children}
        </div>
    );
}

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
};
