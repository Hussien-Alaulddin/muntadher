"use client";

import { InboxIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";

type FormResponseToastProps = {
  id: string | number;
  count: number;
  title: string;
  description: string;
  onView: () => void;
};

export function FormResponseToastCard({
  id,
  count,
  title,
  description,
  onView,
}: FormResponseToastProps) {
  return (
    <Card
      size="sm"
      className="w-[min(100vw-2rem,22rem)] gap-0 border-0 bg-background py-0 shadow-lg ring-1 ring-border/60"
      dir="rtl"
    >
      <div className="flex items-start gap-3 p-3.5 pb-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
          <InboxIcon className="size-4" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm font-semibold leading-none">
              {title}
            </CardTitle>
            <Badge className="h-5 border-transparent bg-success px-1.5 text-[10px] font-semibold text-white hover:bg-success">
              {count > 99 ? "99+" : count}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2 text-xs leading-relaxed">
            {description}
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-mt-0.5 -me-1 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="إغلاق الإشعار"
          onClick={() => toast.dismiss(id)}
        >
          <XIcon />
        </Button>
      </div>

      <CardFooter className="justify-end gap-2 border-t bg-muted/40 py-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toast.dismiss(id)}
        >
          لاحقاً
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-success text-white hover:bg-success/90"
          onClick={() => {
            toast.dismiss(id);
            onView();
          }}
        >
          عرض الردود
        </Button>
      </CardFooter>
    </Card>
  );
}

export function showFormResponseToast(args: {
  count: number;
  title: string;
  description: string;
  onView: () => void;
}) {
  toast.custom(
    (id) => (
      <FormResponseToastCard
        id={id}
        count={args.count}
        title={args.title}
        description={args.description}
        onView={args.onView}
      />
    ),
    {
      duration: 14_000,
      unstyled: true,
      className: "p-0!",
    },
  );
}
