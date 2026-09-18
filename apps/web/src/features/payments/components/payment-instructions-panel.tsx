import { Loader2 } from "lucide-react";
import { usePaymentInstructions } from "../hooks";
import type { PaymentMethod } from "../types";

export function PaymentInstructionsPanel({ method }: { method: PaymentMethod }) {
  const { data, isLoading } = usePaymentInstructions();

  if (isLoading || !data) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }

  if (method === "BANK_TRANSFER") {
    const { accountName, accountNumber, bankName, note } = data.bankTransfer;
    return (
      <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Bank:</span> {bankName}
        </p>
        <p>
          <span className="font-medium text-foreground">Account name:</span> {accountName}
        </p>
        <p>
          <span className="font-medium text-foreground">Account number:</span> {accountNumber}
        </p>
        <p className="mt-2">{note}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{data.inPerson.note}</div>
  );
}
