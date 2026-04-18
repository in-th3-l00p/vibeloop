"use client";

import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/[0.06]",
        className,
      )}
    />
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-3xl rounded-lg bg-card ring-1 ring-border">
      <div className="flex items-center gap-5 px-5 py-3">
        <Bone className="size-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-3.5 w-28" />
          <Bone className="h-2.5 w-20" />
          <Bone className="h-2 w-36" />
        </div>
        <div className="shrink-0 text-center pl-4 border-l border-border space-y-1.5">
          <Bone className="h-5 w-12 mx-auto" />
          <Bone className="h-2 w-8 mx-auto" />
        </div>
        <div className="shrink-0 flex gap-4 text-center pl-3 border-l border-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Bone className="h-4 w-6 mx-auto" />
              <Bone className="h-2 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WelcomeSkeleton() {
  return (
    <div className="flex justify-center">
      <Bone className="h-16 md:h-24 w-80 md:w-[500px] rounded-xl" />
    </div>
  );
}

export function LobbySkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <Bone className="h-3 w-12" />
        <div className="flex gap-2">
          <Bone className="h-6 w-14 rounded-md" />
          <Bone className="h-6 w-16 rounded-md" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="shrink-0 w-40 rounded-xl bg-card ring-1 ring-border overflow-hidden">
            <Bone className="h-16 w-full rounded-none" />
            <div className="px-3 pb-3 pt-7 space-y-2">
              <Bone className="h-3.5 w-20" />
              <Bone className="h-2.5 w-14" />
              <Bone className="h-2.5 w-24" />
              <Bone className="h-3 w-12 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 rounded-lg bg-white/[0.03] ring-1 ring-border py-3 px-2">
            <Bone className="size-4 rounded-full" />
            <Bone className="h-4 w-8" />
            <Bone className="h-2 w-14" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="h-3 w-24" />
            <Bone className="flex-1 h-1.5" />
            <Bone className="h-2.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FriendsSkeleton() {
  return (
    <div className="space-y-0.5 px-3 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Bone className="size-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3.5 w-24" />
            <Bone className="h-2.5 w-16" />
          </div>
          <Bone className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function GamesSkeleton() {
  return (
    <div className="w-full max-w-xl lg:max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <Bone className="h-3 w-14" />
        <Bone className="h-3 w-16" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="shrink-0 w-44 rounded-xl bg-card ring-1 ring-border overflow-hidden">
            <Bone className="h-24 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-2.5 w-32" />
              <Bone className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
