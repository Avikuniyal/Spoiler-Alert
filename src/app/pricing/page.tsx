import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import { Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../supabase/server";

const FREE_PLAN_FEATURES = [
  "Track up to 10 items",
  "Basic expiry alerts",
  "3 recipe suggestions per day",
];

export default async function Pricing() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let result: any[] = [];
    try {
      const { data: plans } = await supabase.functions.invoke('supabase-functions-get-plans');
      result = plans?.items ?? [];
    } catch (error) {
      console.error('Failed to fetch pricing plans:', error);
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
                    <p className="text-xl text-muted-foreground">
                        Choose the perfect plan for your needs
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Free plan — always shown */}
                    <div className="relative overflow-hidden bg-[#111111] rounded-[10px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] p-6 flex flex-col gap-6 border border-white/[0.08] transition-all duration-200 hover:border-white/[0.15]">
                        <div>
                            <h3 className="font-playfair text-xl font-bold text-white">Free</h3>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="font-playfair text-4xl font-bold text-white">$0</span>
                                <span className="font-crimson text-white/50">/month</span>
                            </div>
                        </div>
                        <ul className="flex flex-col gap-3 flex-1">
                            {FREE_PLAN_FEATURES.map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <Check className="w-4 h-4 text-[#0D9488] flex-shrink-0 mt-0.5" />
                                    <span className="font-crimson text-white/60 text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/sign-up"
                            className="w-full py-3 rounded-[10px] font-crimson text-base font-medium text-center transition-all duration-200 hover:scale-[1.02] bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.10]"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {result.map((item: any) => (
                        <PricingCard key={item.id} item={item} user={user} />
                    ))}
                </div>
            </div>
        </>
    );
}