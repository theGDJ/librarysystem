import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("pramaan_locale")?.value;
  return value === "hi" ? "hi" : "en";
}
