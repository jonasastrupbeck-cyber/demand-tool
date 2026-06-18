import StudyChrome from '@/components/StudyChrome';
import { getStudyByCode } from '@/lib/queries';

// Server layout (2026-06-18): resolve the study's systemType server-side so the
// correct branding (Vanguard for demand, Skipton+Vanguard for flow) renders on
// the FIRST paint — fixes the load-time Vanguard→Skipton flash. The nav/branding
// UI itself lives in the client <StudyChrome>.
export default async function StudyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  let isFlow = false;
  try {
    const study = await getStudyByCode(code);
    isFlow = study?.systemType === 'flow';
  } catch {
    // If the lookup fails, fall back to Vanguard (demand) branding.
  }
  return (
    <StudyChrome code={code} isFlow={isFlow}>
      {children}
    </StudyChrome>
  );
}
