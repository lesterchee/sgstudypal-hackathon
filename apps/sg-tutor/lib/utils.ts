// Purpose: Shared utility functions for the sg-tutor application.
// cn() merges Tailwind classes with clsx + tailwind-merge per .cursorrules §4E.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
