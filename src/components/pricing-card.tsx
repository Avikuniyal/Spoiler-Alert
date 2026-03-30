"use client";

import { supabase } from "../../supabase/supabase";
import { User } from "@supabase/supabase-js";
import { Check } from "lucide-react";

export default function PricingCard({ item, user }: {
    item: any,
    user: User | null
}) {
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      window.location.href = "/sign-in";
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-create-checkout', {
        body: {
          productPriceId: priceId,
          successUrl: `${window.location.origin}/dashboard`,
          customerEmail: user.email || '',
          metadata: {
            user_id: user.id,
          } 
        },
        headers: {
          'X-Customer-Email': user.email || '',
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } 
  };

    return (
        <div className={`relative overflow-hidden bg-[#111111] rounded-[10px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] p-6 flex flex-col gap-6 transition-all duration-200 hover:border-white/[0.15] ${
          item.popular 
            ? 'border-2 border-[#0D9488]/60 shadow-[0_0_30px_rgba(13,148,136,0.1)]' 
            : 'border border-white/[0.08]'
        }`}>
            {item.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 text-xs font-crimson font-medium text-white bg-[#0D9488] rounded-full">
                    Most Popular
                </div>
            )}
            <div>
                <h3 className="font-playfair text-xl font-bold text-white">{item.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="font-playfair text-4xl font-bold text-white">${item?.prices?.[0]?.priceAmount / 100}</span>
                    <span className="font-crimson text-white/50">/month</span>
                </div>
            </div>
            {item.description && (
              <ul className="flex flex-col gap-3 flex-1">
                  {item.description.split('\n').map((desc: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-[#0D9488] flex-shrink-0 mt-0.5" />
                          <span className="font-crimson text-white/60 text-sm">{desc.trim()}</span>
                      </li>
                  ))}
              </ul>
            )}
            <button 
                onClick={async () => { await handleCheckout(item?.prices?.[0]?.id) }} 
                className={`w-full py-3 rounded-[10px] font-crimson text-base font-medium transition-all duration-200 hover:scale-[1.02] ${
                    item.popular 
                        ? 'bg-[#0D9488] text-white hover:shadow-[0_0_20px_rgba(13,148,136,0.3)]' 
                        : 'bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.10]'
                }`}
            >
                Get Started
            </button>
        </div>
    )
}