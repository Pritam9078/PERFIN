'use client';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/card';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md space-y-4 text-center">
      <ErrorState message="We could not load this page. Your data is safe. Try again in a moment." />
      <Button onClick={reset} variant="secondary">Try again</Button>
    </div>
  );
}
