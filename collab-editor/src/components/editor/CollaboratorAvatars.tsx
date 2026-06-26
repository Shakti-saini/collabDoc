'use client';
import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getInitials } from '@/lib/utils';

interface Collaborator { id: string; name: string; image?: string; color: string; }

const COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2'];

// Simulated presence — in production use WebSocket/Pusher/PartyKit
export function CollaboratorAvatars({ docId, currentUserId }: { docId: string; currentUserId: string }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    // Fetch document access list to show potential collaborators
    fetch(`/api/documents/${docId}`)
      .then(r => r.json())
      .then(doc => {
        const collabs: Collaborator[] = (doc.access ?? [])
          .filter((a: { user: { id: string } }) => a.user.id !== currentUserId)
          .slice(0, 4)
          .map((a: { user: { id: string; name?: string; image?: string } }, i: number) => ({
            id: a.user.id, name: a.user.name ?? 'User', image: a.user.image,
            color: COLORS[i % COLORS.length],
          }));
        setCollaborators(collabs);
      })
      .catch(() => {});
  }, [docId, currentUserId]);

  if (collaborators.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex -space-x-2">
        {collaborators.map(c => (
          <Tooltip key={c.id}>
            <TooltipTrigger asChild>
              <Avatar className="w-7 h-7 border-2 border-background cursor-pointer" style={{ borderColor: c.color }}>
                <AvatarImage src={c.image} />
                <AvatarFallback style={{ backgroundColor: c.color }} className="text-white text-[10px]">
                  {getInitials(c.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{c.name}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
