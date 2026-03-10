"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  uploadMetadataSchema,
  type UploadMetadata,
  type ExtractedMetadata,
} from "./upload-schema";

interface MetadataFormProps {
  metadata: ExtractedMetadata;
  isSubmitting: boolean;
  onSubmit: (data: UploadMetadata) => void;
  onCancel: () => void;
}

export function MetadataForm({
  metadata,
  isSubmitting,
  onSubmit,
  onCancel,
}: MetadataFormProps) {
  const form = useForm<UploadMetadata>({
    resolver: zodResolver(uploadMetadataSchema),
    defaultValues: {
      name: metadata.name,
      author: metadata.author ?? "",
      pageCount: metadata.pageCount ?? undefined,
    },
  });

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex items-start gap-6">
        <div className="shrink-0 w-32 h-44 rounded-lg overflow-hidden border-2 border-border/40 bg-muted shadow-2xl ring-1 ring-primary/5 transform -rotate-1 transition-transform hover:rotate-0 duration-500">
          {metadata.thumbnailDataUrl ? (
            <Image
              src={metadata.thumbnailDataUrl}
              alt="PDF thumbnail"
              width={128}
              height={176}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <FileText className="w-12 h-12 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-2">
          <p className="text-sm font-semibold text-foreground uppercase tracking-widest">
            Document Preview
          </p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Review your document and make sure everything looks correct
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-tighter">
              PDF
            </div>
            {metadata.pageCount && (
              <div className="px-2.5 py-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                {metadata.pageCount} Pages
              </div>
            )}
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Document Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter document name"
                    {...field}
                    className="rounded-xl border-border/40 bg-muted/30 focus-visible:ring-primary/20 focus-visible:border-primary/40 h-12"
                  />
                </FormControl>
                <FormMessage className="text-xs font-medium ml-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  Author / Publisher
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter author name"
                    {...field}
                    className="rounded-xl border-border/40 bg-muted/30 focus-visible:ring-primary/20 focus-visible:border-primary/40 h-12"
                  />
                </FormControl>
                <FormMessage className="text-xs font-medium ml-1" />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 pt-6 border-t border-border/40">
            <Button
              type="submit"
              className="w-full rounded-xl h-12 text-sm font-medium shadow-lg shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Finalizing Upload...
                </>
              ) : (
                "Save & Add to Library"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full rounded-xl h-12 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all font-medium"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Back to Upload
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
