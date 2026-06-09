import Link from "next/link";
import { CreditCard } from "lucide-react";

export function ManageSubscriptionButton() {
  return (
    <Link
      href="/billing"
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 text-white text-sm font-semibold transition-all"
    >
      <CreditCard className="w-4 h-4" />
      Manage billing
    </Link>
  );
}
