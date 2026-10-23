import { Logo } from '@/components/logo';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md content-center gap-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </div>
      <main id="main"><Card tilt={false} className="p-7">{children}</Card></main>
    </div>
  );
}
