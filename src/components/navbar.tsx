import Link from 'next/link'
import { createClient } from '../../supabase/server'
import { Leaf } from 'lucide-react'
import UserProfile from './user-profile'

export default async function Navbar() {
  const supabase = createClient()

  const { data: { user } } = await (await supabase).auth.getUser()


  return (
    <nav className="w-full border-b border-white/[0.06] bg-black/80 backdrop-blur-sm py-3 sticky top-0 z-30">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0D9488] rounded-[7px] flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <span className="font-playfair text-white font-bold text-base leading-none block">Spoiler</span>
            <span className="font-playfair text-[#0D9488] font-bold text-sm leading-none block">Alert</span>
          </div>
        </Link>
        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 font-crimson text-sm text-white/70 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 font-crimson text-sm text-white/70 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 font-crimson text-sm text-white bg-[#0D9488] rounded-[10px] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(13,148,136,0.3)] transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
