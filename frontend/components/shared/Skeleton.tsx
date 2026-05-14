"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  lines?: number;
  circle?: boolean;
}

export function Skeleton({ className, lines = 1, circle = false }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 gap-3 rounded-lg border border-border bg-white p-4">
            <div className="skeleton h-4 rounded-md" />
            <div className="skeleton h-4 rounded-md" />
            <div className="skeleton h-4 w-2/3 rounded-md" />
            <div className="skeleton h-4 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return <div className={cn("skeleton rounded-md", circle && "rounded-full", className)} />;
}

Skeleton.Card = function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-border space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
};

Skeleton.Row = function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-b border-border">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/6" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
};

Skeleton.Text = function SkeletonText({ lines = 1 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
};

Skeleton.StatCard = function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="mt-8 h-8 w-24" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
};
