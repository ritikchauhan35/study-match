type PresenceUser = { user_id: string; display_name?: string | null; online_at: string };

export const PresenceList = ({ users }: { users: Record<string, PresenceUser[]> }) => {
  const flat = Object.values(users).flat();
  if (flat.length === 0) return <p className="text-sm text-muted-foreground">No one is studying this topic yet.</p>;
  return (
    <ul className="grid gap-2">
      {flat.map((u, idx) => (
        <li key={`${u.user_id}-${idx}`} className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500" aria-hidden />
            <span className="text-sm">{u.display_name || u.user_id.slice(0, 6)}</span>
          </div>
          <span className="text-xs text-muted-foreground">Studying now</span>
        </li>
      ))}
    </ul>
  );
};
