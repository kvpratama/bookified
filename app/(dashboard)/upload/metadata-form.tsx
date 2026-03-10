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
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-24 h-32 rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
          {metadata.thumbnailDataUrl ? (
            <Image
              src={metadata.thumbnailDataUrl}
              alt="PDF thumbnail"
              width={96}
              height={128}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Preview</p>
          <p className="text-xs text-muted-foreground mt-1">
            First page of your PDF
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter document name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input placeholder="Enter author name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Document"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
