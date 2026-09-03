"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SwipeableMainView from "@/components/SwipeableMainView";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=water-tests");
  }, [router]);

  return <SwipeableMainView initialTab="water-tests" />;
}
