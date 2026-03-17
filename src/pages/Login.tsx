import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import asinaLogo from "@/assets/asina-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "Password reset link has been sent." });
      setShowForgot(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(0_0%_96%)] p-4">
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-[hsl(173_72%_36%)] to-[hsl(200_50%_30%)] shadow-2xl p-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="text-center mb-6">
            <img
              src={asinaLogo}
              alt="Asina Disability Services"
              className="mx-auto mb-4 h-14 w-auto brightness-0 invert"
            />
            <h1 className="text-2xl font-heading font-bold text-white">
              {showForgot ? "Reset Password" : "Welcome back"}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {showForgot
                ? "Enter your email to receive a reset link"
                : "Sign in to Asina — NDIS All in One"}
            </p>
          </div>

          {showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-white font-semibold">
                  Email
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="bg-white/20 border-0 text-white placeholder:text-white/50 focus-visible:ring-white/40 focus-visible:ring-offset-0 backdrop-blur-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-[hsl(38_78%_56%)] hover:bg-[hsl(38_78%_48%)] text-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <button
                type="button"
                className="w-full text-sm text-white/80 hover:text-white underline-offset-4 hover:underline transition-colors"
                onClick={() => setShowForgot(false)}
              >
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="bg-white/20 border-0 text-white placeholder:text-white/50 focus-visible:ring-white/40 focus-visible:ring-offset-0 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white font-semibold">
                    Password
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-[hsl(38_78%_56%)] hover:text-[hsl(38_78%_65%)] font-medium transition-colors"
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-white/20 border-0 text-white placeholder:text-white/50 focus-visible:ring-white/40 focus-visible:ring-offset-0 backdrop-blur-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-[hsl(38_78%_56%)] hover:bg-[hsl(38_78%_48%)] text-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center space-y-1">
            <p className="text-white/60 text-xs">
              Contact your administrator for access
            </p>
            <p className="text-xs">
              <span className="text-white/60">NDIS Provider? </span>
              <span className="text-[hsl(38_78%_56%)] font-medium cursor-pointer hover:text-[hsl(38_78%_65%)] transition-colors">
                Register your organisation today!
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
