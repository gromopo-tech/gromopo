import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string, merging Tailwind classes properly
 * @param inputs Class names or conditional class objects
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Optional additional utilities you might want:
export function formatDate(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Creates a URL-friendly slug from a string
 * @param str Input string
 * @returns URL-friendly slug
 */
export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Delays execution for the specified time
 * @param ms Time to wait in milliseconds
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}