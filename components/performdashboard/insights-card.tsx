"use client";

import { CheckCircle2, Info, Lightbulb, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsightItem } from "@/lib/performance-utils";

interface InsightCardProps {
  type: "success" | "info" | "warning" | "tip";
  title: string;
  description: string;
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-700",
  },
  info: {
    icon: Info,
    bg: "bg-sky-50",
    border: "border-sky-200",
    iconColor: "text-sky-500",
    titleColor: "text-sky-700",
  },
  warning: {
    icon: Lightbulb,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    titleColor: "text-amber-700",
  },
  tip: {
    icon: Clock,
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconColor: "text-violet-500",
    titleColor: "text-violet-700",
  },
};

export function InsightCard({ type, title, description }: InsightCardProps) {
  const config = typeConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        "rounded-xl p-4 border",
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
        <div>
          <h4 className={cn("font-semibold text-sm", config.titleColor)}>
            {title}
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

type PerformanceInsightsProps = {
  insights: InsightItem[];
};

export function PerformanceInsights({ insights }: PerformanceInsightsProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100 h-full">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">
        Performance Insights
      </h3>
      <div className="flex flex-col gap-3">
        {insights.map((item, i) => (
          <InsightCard
            key={`${item.title}-${i}`}
            type={item.type}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </div>
  );
}
