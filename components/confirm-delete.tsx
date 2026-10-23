'use client';
import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/errors';

export function ConfirmDelete({ label, title, body, onConfirm, iconOnly = true }: {
  label: string; title: string; body: string; onConfirm: () => Promise<ActionResult>; iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const run = () => start(async () => {
    const r = await onConfirm();
    if (r.ok) { toast.success(r.message ?? 'Deleted'); setOpen(false); } else toast.error(r.error);
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant={iconOnly ? 'ghost' : 'danger'} size={iconOnly ? 'icon' : 'sm'} aria-label={label}><Trash2 className="h-4 w-4" />{!iconOnly && label}</Button>
      </DialogTrigger>
      <DialogContent title={title} description={body}>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="secondary" disabled={pending}>Cancel</Button></DialogClose>
          <Button variant="danger" onClick={run} loading={pending}>{pending ? 'Deleting' : 'Delete'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
