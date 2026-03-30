import Link from "next/link";
import { ArrowUpRight, Leaf, Check } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-black">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,148,136,0.12),transparent_60%)]" />
      
      <div className="relative pt-24 pb-32 sm:pt-36 sm:pb-44">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 bg-[#0D9488]/10 border border-[#0D9488]/30 rounded-full">
              <Leaf size={12} className="text-[#0D9488]" />
              <span className="font-crimson text-sm text-[#0D9488]">Reduce food waste. Save money.</span>
            </div>
            
            <h1 className="font-playfair text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Never Let Food{" "}
              <span className="text-[#0D9488]">
                Go to Waste
              </span>
              {" "}Again
            </h1>
            
            <p className="font-crimson text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Spoiler Alert tracks your pantry, warns you before food expires, discovers recipes from what you have, and shows you exactly how much you're saving.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 text-white bg-[#0D9488] rounded-[10px] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(13,148,136,0.35)] transition-all duration-200 font-crimson text-lg font-medium"
              >
                Start Tracking Free
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>
              
              <Link
                href="#pricing"
                className="inline-flex items-center px-8 py-4 text-white/70 bg-white/[0.06] border border-white/10 rounded-[10px] hover:bg-white/[0.10] hover:text-white transition-all duration-200 font-crimson text-lg"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 font-crimson text-sm text-white/40">
              {['Track expiry dates', 'Discover recipes', 'Visualize savings'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#0D9488]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
