// apps\web\app\(public)\register\page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { homeFor } from "@/lib/routes";
import { cn } from "@/lib/utils";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Include at least one letter and one digit"),
  monthlyIncome: z.string().regex(/^\d{1,10}(\.\d{1,3})?$/, "Enter an amount like 2500 or 2500.500"),
  phone: z
    .string()
    .regex(/^[+0-9 ]{8,20}$/, "Use 8 to 20 digits, spaces or +")
    .or(z.literal(""))
    .optional(),
});
type FormValues = z.infer<typeof schema>;

/** Shows, as you type, which of the three password rules are already met. */
function PasswordRules({ control }: { control: Control<FormValues> }) {
  const password = useWatch({ control, name: "password" }) ?? "";
  const rules = [
    { ok: password.length >= 10, label: "10 characters or more" },
    { ok: /[A-Za-z]/.test(password), label: "A letter" },
    { ok: /\d/.test(password), label: "A digit" },
  ];

  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5" aria-label="Password rules">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            rule.ok ? "font-semibold text-positive" : "text-ink-soft",
          )}
        >
          <span
            className={cn(
              "grid size-4 place-items-center border transition-colors",
              rule.ok ? "border-positive bg-positive text-card" : "border-ink/30",
            )}
            aria-hidden="true"
          >
            {rule.ok && <Check className="size-3" strokeWidth={3.5} />}
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp, user, status } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(homeFor(user.role));
  }, [status, user, router]);

  async function onSubmit(values: FormValues) {
    try {
      const created = await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        monthlyIncome: values.monthlyIncome,
        phone: values.phone || undefined,
      });
      router.replace(homeFor(created.role));
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Something went wrong" });
    }
  }

  return (
    <AuthShell
      title="Open your account"
      subtitle="It takes a minute. Your income is only used for loan checks."
      headline="An account in a minute. Nothing hidden after."
      image="/images/auth-register.jpg"
      footer={
        <>
          Already a customer?{" "}
          <Link href="/login" className="font-semibold text-brand underline underline-offset-4 decoration-2">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <input id="fullName" autoComplete="name" className={inputClass} {...register("fullName")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClass} {...register("email")} />
        </Field>
        <div>
          <Field label="Password" htmlFor="password" error={errors.password?.message}>
            <PasswordInput id="password" autoComplete="new-password" {...register("password")} />
          </Field>
          <PasswordRules control={control} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Monthly income (TND)" htmlFor="monthlyIncome" error={errors.monthlyIncome?.message}>
            <input
              id="monthlyIncome"
              inputMode="decimal"
              placeholder="2500.000"
              className={`${inputClass} num`}
              {...register("monthlyIncome")}
            />
          </Field>
          <Field label="Phone (optional)" htmlFor="phone" error={errors.phone?.message}>
            <input id="phone" type="tel" autoComplete="tel" className={inputClass} {...register("phone")} />
          </Field>
        </div>

        {errors.root && (
          <p role="alert" className="border-l-4 border-negative bg-negative/10 px-4 py-3 text-sm font-medium text-negative">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
