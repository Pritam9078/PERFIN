import Link from 'next/link';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="PERFIN home">
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-lime">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#0a0a0a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 20V5h6.5a4.5 4.5 0 0 1 0 9H6" /><path d="M16 20v-6" opacity=".55" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight">PERFIN</span>
    </Link>
  );
}
