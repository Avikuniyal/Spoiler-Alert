import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { Leaf } from "lucide-react";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
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
              <h1 className="font-playfair text-3xl font-bold text-white">Create account</h1>
              <p className="font-crimson text-sm text-white/50">
                Already have an account?{" "}
                <Link className="text-[#0D9488] font-medium hover:underline transition-all" href="/sign-in">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="font-crimson text-sm text-white/70">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="w-full bg-[#0a0a0a] border-white/10 text-white placeholder-white/30 focus:border-[#0D9488]/60 focus:ring-[#0D9488]/20 rounded-[10px] font-crimson"
                />
              </div>

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
                <Label htmlFor="password" className="font-crimson text-sm text-white/70">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Your password"
                  minLength={6}
                  required
                  className="w-full bg-[#0a0a0a] border-white/10 text-white placeholder-white/30 focus:border-[#0D9488]/60 focus:ring-[#0D9488]/20 rounded-[10px] font-crimson"
                />
              </div>
            </div>

            <SubmitButton
              formAction={signUpAction}
              pendingText="Signing up..."
              className="w-full bg-[#0D9488] hover:bg-[#0b7e74] text-white rounded-[10px] font-crimson text-base py-2.5 transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(13,148,136,0.3)]"
            >
              Sign up
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </div>
        <SmtpMessage />
      </div>
    </>
  );
}
