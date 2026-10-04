"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateQuotation } from "../hooks";
import { useAiEnabled, useDraftQuotation } from "@/features/ai/hooks";
import type { QuotationDraft } from "@/features/ai/types";
import { AiDisclaimer, CitedText } from "@/features/ai/components/ai-answer";
import { quotationSchema, toQuotationPayload, type QuotationInput } from "../schemas";

export function QuotationFormDialog({
  chatId,
  projectRequestId,
  trigger,
}: {
  chatId: string;
  projectRequestId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createQuotation = useCreateQuotation();
  const aiEnabled = useAiEnabled();
  const draftQuotation = useDraftQuotation(chatId);
  const [draftInstructions, setDraftInstructions] = useState("");
  const [draft, setDraft] = useState<QuotationDraft | null>(null);

  const form = useForm<QuotationInput>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      notes: "",
      validUntil: "",
      items: [{ description: "", quantity: "1", unitPrice: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  function applyDraft() {
    draftQuotation.mutate(draftInstructions.trim() || undefined, {
      onSuccess: (result) => {
        setDraft(result);
        form.reset({
          notes: result.notes,
          validUntil: form.getValues("validUntil"),
          items:
            result.items.length > 0
              ? result.items.map((item) => ({
                  description: item.description,
                  quantity: String(item.quantity),
                  unitPrice: String(item.unitPrice),
                }))
              : [{ description: "", quantity: "1", unitPrice: "" }],
        });
      },
    });
  }

  function onSubmit(values: QuotationInput) {
    createQuotation.mutate(toQuotationPayload(chatId, values, projectRequestId), {
      onSuccess: () => {
        setOpen(false);
        setDraft(null);
        setDraftInstructions("");
        form.reset({ notes: "", validUntil: "", items: [{ description: "", quantity: "1", unitPrice: "" }] });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send a quotation</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1">
            {aiEnabled && (
              <div className="grid gap-2 rounded-lg border border-border/60 bg-muted/40 p-3">
                <div className="flex gap-2">
                  <Input
                    value={draftInstructions}
                    maxLength={500}
                    onChange={(event) => setDraftInstructions(event.target.value)}
                    placeholder="Optional: guidance for the draft"
                  />
                  <Button type="button" variant="secondary" disabled={draftQuotation.isPending} onClick={applyDraft}>
                    {draftQuotation.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    Draft with AI
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fills the form from this conversation and your own past quotations. Review every line before sending.
                </p>
                {draft && (
                  <div className="grid gap-1">
                    <CitedText text={draft.rationale} className="text-xs text-muted-foreground" />
                    {draft.basedOn.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Based on:{" "}
                        {draft.basedOn
                          .map(
                            (quote) =>
                              `[${quote.n}] ${quote.status.toLowerCase()} quote of ${quote.totalAmount.toLocaleString()} (${new Date(quote.createdAt).toLocaleDateString()})`,
                          )
                          .join(", ")}
                      </p>
                    )}
                    <AiDisclaimer />
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <FormLabel>Line items</FormLabel>
              {fields.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <Input type="number" min={0} placeholder="Qty" value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem className="w-28">
                        <FormControl>
                          <Input type="number" min={0} placeholder="Unit price" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => append({ description: "", quantity: "1", unitPrice: "" })}
              >
                <Plus />
                Add item
              </Button>
              {form.formState.errors.items?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.items.root.message}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid until</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="mt-2 w-fit" disabled={createQuotation.isPending}>
              {createQuotation.isPending && <Loader2 className="size-4 animate-spin" />}
              Send quotation
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
