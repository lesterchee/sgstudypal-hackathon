import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ---------------------------------------------------------------------------
// Purpose: Merge Tailwind class names with conflict resolution.
// Usage:  cn("bg-red-500", isActive && "bg-blue-500") → resolves correctly.
// ---------------------------------------------------------------------------
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
