import { redirect } from "next/navigation";

/**
 * The certification guide moved to /certification. Kept as a permanent
 * redirect so printed decks, SIH material and old bookmarks keep working.
 */
export default function GuideRedirect() {
  redirect("/certification");
}
