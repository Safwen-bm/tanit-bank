"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { homeFor, safeNext } from "@/lib/routes";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { login, user, status } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(next ?? homeFor(user.role));
  }, [status, user, next, router]);

  async function onSubmit(values: FormValues) {
    try {
      const signedIn = await login(values.email, values.password);
      router.replace(next ?? homeFor(signedIn.role));
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Something went wrong" });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" className={inputClass} {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          {...register("password")}
        />
      </Field>

      {errors.root && (
        <p role="alert" className="rounded-lg border-2 border-negative px-4 py-3 text-sm text-negative">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your accounts."
      footer={
        <>
          New to Tanit Bank?{" "}
          <Link href="/register" className="font-semibold text-brand underline underline-offset-4">
            Open an account
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}