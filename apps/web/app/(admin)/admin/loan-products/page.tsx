// apps\web\app\(admin)\admin\loan-products\page.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatTnd } from "@/lib/format";
import { fractionToPercent } from "@/lib/money";
import { useAdminProducts } from "@/lib/queries";
import type { AdminLoanProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

function ProductRow({
  product,
  onEdit,
}: {
  product: AdminLoanProduct;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const toggle = useMutation({
    mutationFn: () => api(`/admin/loan-products/${product.id}`, { method: "PATCH", body: { isActive: !product.isActive } }),
    onSuccess: () => {
      toast.success(product.isActive ? "Product deactivated" : "Product activated");
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => api(`/admin/loan-products/${product.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Product deleted");
      void queryClient.invalidateQueries();
    },
    onError: (error) => {
      setConfirming(false);
      toast.error(error.message);
    },
  });

  return (
    <article
      className={cn(
        "rounded-xl border-2 border-ink bg-card p-6",
        !product.isActive && "border-dashed opacity-75",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-xl font-semibold">{product.name}</h3>
            <span
              className={cn(
                "num rounded border px-2 py-0.5 text-[10px] tracking-wider uppercase",
                product.isActive ? "border-positive text-positive" : "border-ink-soft text-ink-soft",
              )}
            >
              {product.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {product.description && <p className="mt-1 text-sm text-ink-soft">{product.description}</p>}
        </div>
        <p className="num text-4xl font-semibold">
          {Number(product.annualRate).toFixed(2)}
          <span className="ml-1 text-lg text-ink-soft">%</span>
        </p>
      </div>

      <dl className="num mt-5 grid gap-4 border-t-2 border-dashed border-rule pt-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink-soft">Amount</dt>
          <dd className="mt-1">
            {formatTnd(product.minAmount).replace(" TND", "")} to {formatTnd(product.maxAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">Duration</dt>
          <dd className="mt-1">
            {product.minMonths} to {product.maxMonths} months
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">Max debt ratio</dt>
          <dd className="mt-1">{fractionToPercent(product.maxDebtRatio)} %</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Loans granted</dt>
          <dd className="mt-1">{product.loanCount}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="outline" loading={toggle.isPending} onClick={() => toggle.mutate()}>
          {product.isActive ? "Deactivate" : "Activate"}
        </Button>
        {confirming ? (
          <>
            <Button size="sm" loading={remove.isPending} onClick={() => remove.mutate()}>
              Confirm delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={product.loanCount > 0}
            title={product.loanCount > 0 ? "Loans are attached: deactivate instead" : undefined}
            onClick={() => setConfirming(true)}
          >
            Delete
          </Button>
        )}
      </div>
    </article>
  );
}

export default function AdminLoanProductsPage() {
  const products = useAdminProducts();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-xs tracking-[0.25em] text-accent uppercase">Back office</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Loan products</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Rates and limits set here feed the public simulator immediately. Loans already granted keep the conditions
            they were approved with.
          </p>
        </div>
        {!creating && (
          <Button
            onClick={() => {
              setEditingId(null);
              setCreating(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            New product
          </Button>
        )}
      </header>

      {creating && <ProductForm onDone={() => setCreating(false)} />}

      {products.isLoading ? (
        <p className="text-ink-soft">Loading...</p>
      ) : products.data && products.data.length > 0 ? (
        <div className="space-y-5">
          {products.data.map((product) =>
            editingId === product.id ? (
              <ProductForm key={product.id} product={product} onDone={() => setEditingId(null)} />
            ) : (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={() => {
                  setCreating(false);
                  setEditingId(product.id);
                }}
              />
            ),
          )}
        </div>
      ) : (
        <p className="rounded-xl border-2 border-dashed border-rule p-10 text-center text-ink-soft">
          No loan products yet. Create the first one.
        </p>
      )}
    </div>
  );
}