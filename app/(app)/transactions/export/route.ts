import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transactionFiltersSchema } from '@/lib/validations';
import { exportTransactions, toCsv } from '@/lib/services/transactions';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const parsed = transactionFiltersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return new NextResponse('Invalid filters', { status: 400 });

  try {
    const rows = await exportTransactions(supabase, parsed.data); // RLS + auth.uid() scope this to the caller
    return new NextResponse('\uFEFF' + toCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="perfin-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse('Export failed', { status: 500 });
  }
}
