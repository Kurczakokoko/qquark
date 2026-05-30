import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * High-quality cn() helper.
 * We don't cheap out on basic utilities either.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
