"use client";
import { ErrorState } from "@/base/components/layout/common";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorState retry={reset} />;
}
