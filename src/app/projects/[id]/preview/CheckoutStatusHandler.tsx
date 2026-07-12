"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutStatusHandler({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");
  const sessionId = searchParams.get("session_id");
  const [checking, setChecking] = useState(() => checkout === "success" && Boolean(sessionId));

  useEffect(() => {
    if (checkout === "success" && sessionId) {
      fetch(`/api/projects/${projectId}/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.payment?.status === "paid") {
            router.push(`/projects/${projectId}/report`);
          } else {
            setChecking(false);
          }
        })
        .catch(() => setChecking(false));
    }
  }, [checkout, projectId, router, sessionId]);

  if (!checking) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Confirming your payment…
    </div>
  );
}
