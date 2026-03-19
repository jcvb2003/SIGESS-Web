interface MembersTableContainerProps {
  children: React.ReactNode;
}
export function MembersTableContainer({
  children,
}: MembersTableContainerProps) {
  return (
    <div className="rounded-md border border-border/60 overflow-hidden">
      {children}
    </div>
  );
}
