import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div><h1 className="text-4xl font-extrabold">Page not found</h1><p className="mb-6 mt-2 text-mute">That page does not exist, or it is not yours to see.</p><Button asChild><Link href="/dashboard">Back to dashboard</Link></Button></div>
    </div>
  );
}
