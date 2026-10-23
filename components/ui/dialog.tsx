'use client';
import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <D.Content className="surface fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <D.Title className="text-xl font-bold">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-sm text-mute">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="rounded-full p-2 text-mute hover:bg-white/5 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}
