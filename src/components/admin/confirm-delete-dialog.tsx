"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** اسم العنصر المعروض في الرسالة */
  itemLabel?: string | null;
  /** اسم القسم (مثل: المشاريع، المنتجات) */
  collectionLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  itemLabel,
  collectionLabel,
  loading = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const name = itemLabel?.trim();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            {loading ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {loading ? "جاري الحذف…" : "تأكيد الحذف"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {loading ? (
              <>يرجى الانتظار بينما يتم حذف العنصر.</>
            ) : name ? (
              <>
                هل تريد حذف «{name}»
                {collectionLabel ? <> من {collectionLabel}</> : null} نهائياً؟
                لا يمكن التراجع عن هذا الإجراء.
              </>
            ) : (
              <>
                هل تريد حذف هذا العنصر
                {collectionLabel ? <> من {collectionLabel}</> : null} نهائياً؟
                لا يمكن التراجع عن هذا الإجراء.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={loading}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {loading ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <Trash2Icon />
            )}
            {loading ? "جاري الحذف…" : "حذف نهائياً"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
