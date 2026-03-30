import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Leaf } from "lucide-react";

interface LoginProps {
  searchParams: Promise<Message>;
}

export default async function SignInPage({ searchParams }: LoginProps) {
  const message = await searchParams;

  if ("message" in message) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={message} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-8">
        <div className="w-full max-w-md rounded-[15px] border border-white/[0.08] bg-[#111111] p-8 shadow-[2px_2px_0_rgba(0,0,0,0.1)]">
          <form className="flex flex-col space-y-6">
            <div className="space-y-2 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[#0D9488]/15 border border-[#0D9488]/30 rounded-[10px] flex items-center justify-center">
                  <Leaf size={22} className="text-[#0D9488]" />
                </div>
              </div>
              <h1 className="font-playfair text-3xl font-bold text-white">Welcome back</h1>
              <p className="font-crimson text-sm text-white/50">
                Don't have an account?{" "}
                <Link className="text-[#0D9488] font-medium hover:underline transition-all" href="/sign-up">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-crimson text-sm text-white/70">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#0a0a0a] border-white/10 text-white placeholder-white/30 focus:border-[#0D9488]/60 focus:ring-[#0D9488]/20 rounded-[10px] font-crimson"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-crimson text-sm text-white/70">Password</Label>
                  <Link className="font-crimson text-xs text-white/40 hover:text-[#0D9488] transition-all" href="/forgot-password">
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Your password"
                  required
                  className="w-full bg-[#0a0a0a] border-white/10 text-white placeholder-white/30 focus:border-[#0D9488]/60 focus:ring-[#0D9488]/20 rounded-[10px] font-crimson"
                />
              </div>
            </div>

            <SubmitButton
              className="w-full bg-[#0D9488] hover:bg-[#0b7e74] text-white rounded-[10px] font-crimson text-base py-2.5 transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(13,148,136,0.3)]"
              pendingText="Signing in..."
              formAction={signInAction}
            >
              Sign in
            </SubmitButton>

            <FormMessage message={message} />
          </form>
        </div>
      </div>
    </>
  );
}
