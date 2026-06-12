import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div className="hero-surface flex min-h-screen items-center justify-center px-6 py-16">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
