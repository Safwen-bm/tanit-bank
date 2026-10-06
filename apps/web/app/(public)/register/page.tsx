"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { homeFor } from "@/lib/routes";

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

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp, user, status } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
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
      footer={
        <>
          Already a customer?{" "}
          <Link href="/login" className="font-semibold text-brand underline underline-offset-4">
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
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 10 characters, with a letter and a digit."
        >
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register("password")}
          />
        </Field>
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
          <p role="alert" className="rounded-lg border-2 border-negative px-4 py-3 text-sm text-negative">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}