import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type KPITone = "primary" | "emerald" | "amber" | "blue" | "rose" | "purple" | "muted";

export interface KPISummaryCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ElementType<{ className?: string }>;
  tone?: KPITone;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
}

const TONE_MAP: Record<
  KPITone,
  {
    iconBg: string;
    iconColor: string;
    activeBorder: string;
    activeRing: string;
  }
> = {
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    activeBorder: "border-primary",
    activeRing: "ring-1 ring-primary/25",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    activeBorder: "border-emerald-500",
    activeRing: "ring-1 ring-emerald-500/25",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    activeBorder: "border-amber-500",
    activeRing: "ring-1 ring-amber-500/25",
  },
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    activeBorder: "border-blue-500",
    activeRing: "ring-1 ring-blue-500/25",
  },
  rose: {
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    activeBorder: "border-rose-500",
    activeRing: "ring-1 ring-rose-500/25",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
    activeBorder: "border-purple-500",
    activeRing: "ring-1 ring-purple-500/25",
  },
  muted: {
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    activeBorder: "border-foreground/30",
    activeRing: "ring-1 ring-foreground/20",
  },
};

export function KPISummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  isActive = false,
  onClick,
  className,
  valueClassName,
}: KPISummaryCardProps) {
  const toneStyle = TONE_MAP[tone] || TONE_MAP.primary;

  const content = (
    <>
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <span className="text-xs font-medium text-muted-foreground truncate leading-tight">
          {label}
        </span>
        <div
          className={cn(
            "flex size-7 sm:size-7.5 shrink-0 items-center justify-center rounded-lg transition-transform",
            toneStyle.iconBg,
            toneStyle.iconColor,
            onClick && "group-hover:scale-105",
          )}
        >
          <Icon className="size-3.5 sm:size-4" />
        </div>
      </div>

      <div className="min-w-0 mt-auto pt-1">
        <div
          className={cn(
            "text-xl sm:text-2xl font-bold font-mono tabular-nums text-foreground tracking-tight leading-tight truncate",
            valueClassName,
          )}
        >
          {value}
        </div>
        {hint ? (
          <p className="text-[11px] sm:text-xs text-muted-foreground/80 truncate mt-0.5 leading-snug">
            {hint}
          </p>
        ) : null}
      </div>
    </>
  );

  const sharedClasses = cn(
    "w-full min-w-0 h-[104px] sm:h-[112px] p-3 sm:p-3.5 rounded-xl border bg-card shadow-xs flex flex-col justify-between text-left transition-all overflow-hidden select-none",
    isActive
      ? cn(toneStyle.activeBorder, toneStyle.activeRing, "bg-card")
      : cn(
          "border-border",
          onClick && "hover:border-primary/40 hover:bg-muted/30 cursor-pointer group",
        ),
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClasses}>
        {content}
      </button>
    );
  }

  return <div className={sharedClasses}>{content}</div>;
}

export function KPISummaryCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full min-w-0 h-[104px] sm:h-[112px] p-3 sm:p-3.5 rounded-xl border border-border bg-card shadow-xs animate-pulse bg-muted/30 flex flex-col justify-between",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="h-3.5 w-20 bg-muted/60 rounded" />
        <div className="size-7 sm:size-7.5 bg-muted/60 rounded-lg shrink-0" />
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="h-6 w-24 bg-muted/60 rounded" />
        <div className="h-3 w-28 bg-muted/40 rounded" />
      </div>
    </div>
  );
}
