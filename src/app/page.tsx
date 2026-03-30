import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import { ArrowUpRight, Clock, ChefHat, TrendingUp, ShieldCheck, Leaf } from 'lucide-react';
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke('supabase-functions-get-plans');

  const result = plans?.items;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-crimson text-sm text-[#0D9488] uppercase tracking-widest">Features</span>
            <h2 className="font-playfair text-4xl font-bold text-white mt-2 mb-4">Everything You Need to Beat Waste</h2>
            <p className="font-crimson text-white/50 max-w-2xl mx-auto text-lg">A complete toolkit to track, reduce, and celebrate every food item you save.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Clock className="w-5 h-5" />, title: "Expiry Tracking", description: "Visual urgency indicators warn you days before food expires" },
              { icon: <ChefHat className="w-5 h-5" />, title: "Recipe Discovery", description: "Get recipe ideas matched to your soon-to-expire ingredients" },
              { icon: <TrendingUp className="w-5 h-5" />, title: "Savings Dashboard", description: "Watch your savings grow with every item you use before expiry" },
              { icon: <ShieldCheck className="w-5 h-5" />, title: "Smart Alerts", description: "Timely notifications so nothing slips through the cracks" },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-[#111111] border border-white/[0.08] rounded-[10px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] p-6 hover:border-white/[0.15] transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-[#0D9488]/15 rounded-[7px] flex items-center justify-center text-[#0D9488] mb-4 group-hover:bg-[#0D9488]/25 transition-colors duration-200">
                  {feature.icon}
                </div>
                <h3 className="font-playfair text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="font-crimson text-white/50">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/[0.06]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { value: '$180', label: 'Average Annual Household Savings', suffix: '+' },
              { value: '40%', label: 'of Household Food Is Wasted', suffix: '' },
              { value: '1.3B', label: 'Tonnes of Food Wasted Globally per Year', suffix: '' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="font-playfair text-5xl font-bold text-[#0D9488]">{stat.value}<span className="text-3xl">{stat.suffix}</span></div>
                <div className="font-crimson text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-black" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="font-crimson text-sm text-[#0D9488] uppercase tracking-widest">Pricing</span>
            <h2 className="font-playfair text-4xl font-bold text-white mt-2 mb-4">Simple, Transparent Pricing</h2>
            <p className="font-crimson text-white/50 max-w-2xl mx-auto text-lg">Choose the perfect plan. No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {result?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0D9488]/5 border-t border-[#0D9488]/20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-[#0D9488]/20 rounded-full flex items-center justify-center">
              <Leaf size={24} className="text-[#0D9488]" />
            </div>
          </div>
          <h2 className="font-playfair text-4xl font-bold text-white mb-4">Start Saving Today</h2>
          <p className="font-crimson text-white/50 mb-8 max-w-2xl mx-auto text-lg">
            Join eco-conscious households who've already saved hundreds of dollars and reduced their food waste.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 text-white bg-[#0D9488] rounded-[10px] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(13,148,136,0.35)] transition-all duration-200 font-crimson text-lg font-medium"
          >
            Get Started Free
            <ArrowUpRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
