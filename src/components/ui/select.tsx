"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, onValueChange, ...props }, ref) => {
        return (
            <select
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                onChange={(e) => onValueChange?.(e.target.value)}
                {...props}
            >
                {children}
            </select>
        );
    }
);
Select.displayName = "Select";

interface SelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
    children: React.ReactNode;
}

const SelectOption = React.forwardRef<HTMLOptionElement, SelectOptionProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <option
                className={cn("bg-background text-foreground", className)}
                ref={ref}
                {...props}
            >
                {children}
            </option>
        );
    }
);
SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
