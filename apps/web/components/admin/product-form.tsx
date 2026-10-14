// apps\web\components\admin\product-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { api } from "@/lib/api";
import { fractionToPercent, percentToFraction, trimZeros } from "@/lib/money";
import type { AdminLoanProduct } from "@/lib/types";

const money = z.string().regex(/^\d{1,9}(\.\d{1,3})?$/, "Enter an amount like 1000 or 1000.500");
const months = z
  .string()
  .regex(/^\d{1,3}$/, "Whole months")
  .refine((value) => Number(value) >= 1 && Number(value) <= 360, "Between 1 and 360");

const schema = z
  .object({
    name: z.string().trim().min(2, "At least 2 characters").max(60),
    description: z.string().max(200).optional(),
    annualRate: z
      .string()
      .regex(/^\d{1,2}(\.\d{1,4})?$/, "Percent like 9.5 or 12.25")
      .refine((value) => Number(value) <= 40, "At most 40 %"),
    minAmount: money,
    maxAmount: money,
    minMonths: months,
    maxMonths: months,
    maxDebtRatio: z
      .string()
      .regex(/^\d{1,3}(\.\d{1,2})?$/, "Percent like 40 or 37.5")
      .refine((value) => Number(value) > 0 && Number(value) <= 100, "Between 0 and 100"),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (Number(value.maxAmount) < Number(value.minAmount)) {
      ctx.addIssue({ code: "custom", path: ["maxAmount"], message: "Must be at least the minimum" });
    }
    if (Number(value.maxMonths) < Number(value.minMonths)) {
      ctx.addIssue({ code: "custom", path: ["maxMonths"], message: "Must be at least the minimum" });
    }
  });
type FormValues = z.infer<typeof schema>;

function defaultsFor(product?: AdminLoanProduct): FormValues {
  if (!product) {
    return {
      name: "",
      description: "",
      annualRate: "",
      minAmount: "",
      maxAmount: "",
      minMonths: "",
      maxMonths: "",
      maxDebtRatio: "40",
      isActive: true,
    };
  }
  return {
    name: product.name,
    description: product.description ?? "",
    annualRate: trimZeros(product.annualRate),
    minAmount: trimZeros(product.minAmount),
    maxAmount: trimZeros(product.maxAmount),
    minMonths: String(product.minMonths),
    maxMonths: String(product.maxMonths),
    maxDebtRatio: fractionToPercent(product.maxDebtRatio),
    isActive: product.isActive,
  };
}

export function ProductForm({ product, onDone }: { product?: AdminLoanProduct; onDone: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: defaultsFor(product) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const body = {
        name: values.name,
        description: values.description ?? "",
        annualRate: values.annualRate,
        minAmount: values.minAmount,
        maxAmount: values.maxAmount,
        minMonths: Number(values.minMonths),
        maxMonths: Number(values.maxMonths),
        maxDebtRatio: percentToFraction(values.maxDebtRatio),
        isActive: values.isActive,
      };
      return product
        ? api<AdminLoanProduct>(`/admin/loan-products/${product.id}`, { method: "PATCH", body })
        : api<AdminLoanProduct>("/admin/loan-products", { method: "POST", body });
    },
    onSuccess: () => {
      toast.success(product ? "Product updated" : "Product created");
      void queryClient.invalidateQueries();
      onDone();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="space-y-7 rounded-xl border-2 border-ink bg-card p-6 shadow-[4px_4px_0_0_var(--ink)]"
      noValidate
    >
      <h2 className="font-display text-xl font-semibold">{product ? `Edit ${product.name}` : "New loan product"}</h2>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field label="Name" htmlFor="p-name" error={errors.name?.message}>
          <input id="p-name" className={inputClass} {...register("name")} />
        </Field>
        <Field label="Annual rate (%)" htmlFor="p-rate" error={errors.annualRate?.message}>
          <input id="p-rate" inputMode="decimal" placeholder="9.5" className={`${inputClass} num`} {...register("annualRate")} />
        </Field>
      </div>

      <Field label="Description (optional)" htmlFor="p-desc" error={errors.description?.message}>
        <input id="p-desc" className={inputClass} {...register("description")} />
      </Field>

      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Min amount (TND)" htmlFor="p-min" error={errors.minAmount?.message}>
          <input id="p-min" inputMode="decimal" className={`${inputClass} num`} {...register("minAmount")} />
        </Field>
        <Field label="Max amount (TND)" htmlFor="p-max" error={errors.maxAmount?.message}>
          <input id="p-max" inputMode="decimal" className={`${inputClass} num`} {...register("maxAmount")} />
        </Field>
        <Field label="Min months" htmlFor="p-minm" error={errors.minMonths?.message}>
          <input id="p-minm" inputMode="numeric" className={`${inputClass} num`} {...register("minMonths")} />
        </Field>
        <Field label="Max months" htmlFor="p-maxm" error={errors.maxMonths?.message}>
          <input id="p-maxm" inputMode="numeric" className={`${inputClass} num`} {...register("maxMonths")} />
        </Field>
      </div>

      <div className="grid items-end gap-7 sm:grid-cols-2">
        <Field
          label="Max debt ratio (%)"
          htmlFor="p-ratio"
          error={errors.maxDebtRatio?.message}
          hint="Largest share of declared monthly income a payment may take."
        >
          <input id="p-ratio" inputMode="decimal" className={`${inputClass} num`} {...register("maxDebtRatio")} />
        </Field>
        <label className="flex cursor-pointer items-center gap-3 pb-2 text-sm font-medium">
          <input type="checkbox" className="size-5 accent-brand" {...register("isActive")} />
          Active (visible to visitors and customers)
        </label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={mutation.isPending}>
          {product ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}