import Link from 'next/link';
import { Leaf, Twitter, Github } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] border-t border-white/[0.06]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-[#0D9488] rounded-[7px] flex items-center justify-center">
                <Leaf size={14} className="text-white" />
              </div>
              <span className="font-playfair text-white font-bold">Spoiler Alert</span>
            </div>
            <p className="font-crimson text-white/40 text-sm">
              Helping households reduce food waste and save money, one expiry date at a time.
            </p>
          </div>

          <div>
            <h3 className="font-playfair font-semibold text-white mb-4 text-sm">Product</h3>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Dashboard'].map(item => (
                <li key={item}><Link href={item === 'Dashboard' ? '/dashboard' : `#${item.toLowerCase()}`} className="font-crimson text-white/40 hover:text-[#0D9488] transition-colors text-sm">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-playfair font-semibold text-white mb-4 text-sm">Company</h3>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers'].map(item => (
                <li key={item}><Link href="#" className="font-crimson text-white/40 hover:text-[#0D9488] transition-colors text-sm">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-playfair font-semibold text-white mb-4 text-sm">Legal</h3>
            <ul className="space-y-2">
              {['Privacy', 'Terms', 'Security'].map(item => (
                <li key={item}><Link href="#" className="font-crimson text-white/40 hover:text-[#0D9488] transition-colors text-sm">{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/[0.06]">
          <div className="font-crimson text-white/30 text-sm mb-4 md:mb-0">
            © {currentYear} Spoiler Alert. All rights reserved.
          </div>
          <div className="flex gap-4">
            {[Twitter, Github].map((Icon, i) => (
              <a key={i} href="#" className="text-white/30 hover:text-[#0D9488] transition-colors">
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
