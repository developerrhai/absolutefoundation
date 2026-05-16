import SubjectsPageClient from "./SubjectsPageClient";

/** Skip static prerender — page uses auth, API, and browser APIs */
export const dynamic = "force-dynamic";

export default function SubjectsPage() {
  return <SubjectsPageClient />;
}
