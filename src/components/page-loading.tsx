'use client'

import { Spinner } from "@/components/ui/spinner";

export function PageLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <Spinner size="md" className="text-base" />
    </div>
  );
}
