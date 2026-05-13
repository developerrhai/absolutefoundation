"use client";

import { TrendingUp, Star, Trophy, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon: "percentage" | "star" | "rank" | "attendance";
  className?: string;
}

const iconMap = {
  percentage: { icon: TrendingUp, bg: "bg-teal-50", color: "text-teal-600" },
  star: { icon: Star, bg: "bg-amber-50", color: "text-amber-500" },
  rank: { icon: Trophy, bg: "bg-rose-50", color: "text-rose-500" },
  attendance: { icon: BarChart3, bg: "bg-emerald-50", color: "text-emerald-600" },
};

export function StatsCard({
  title,
  value,
  subValue,
  change,
  changeLabel,
  icon,
  className,
}: StatsCardProps) {
  const IconComponent = iconMap[icon].icon;
  const isPositive = change && change > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-slate-100",
        className
      )}
    >
      <div className={cn("rounded-lg p-2.5", iconMap[icon].bg)}>
        <IconComponent className={cn("h-5 w-5", iconMap[icon].color)} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-500 font-medium">{title}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          {subValue && (
            <span className="text-sm text-slate-400 font-medium">{subValue}</span>
          )}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={cn(
                "text-xs font-semibold",
                isPositive ? "text-emerald-500" : "text-red-500"
              )}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(change)}%
            </span>
            {changeLabel && (
              <span className="text-xs text-slate-400">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
