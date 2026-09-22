export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7">
      <div>
        <h1 className="text-[25px] leading-tight font-bold tracking-tight text-slate-950">{title}</h1>
        {description && (
          <p className="text-[13px] text-slate-500 mt-1.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
