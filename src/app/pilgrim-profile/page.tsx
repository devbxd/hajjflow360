import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { getAllPilgrims } from '@/lib/data/pilgrims';

// "Pilgrim Profile" as a standalone sidebar entry can't point at one fixed
// pilgrim id (that 404s the moment that pilgrim is deleted) — it resolves to
// whichever pilgrim is first for the signed-in company instead.
export default async function PilgrimProfileIndexPage() {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const pilgrims = await getAllPilgrims(session.companyId);
  if (pilgrims.length === 0) {
    redirect('/pilgrim-management');
  }

  redirect(`/pilgrim-profile/${pilgrims[0].id}`);
}
