import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDocumentName } from "@/lib/utils";
import { ChatPageClient } from "./chat-page-client";
import type { ChatDocument } from "./types";

const getDocument = cache(async (id: string) => {
  const supabase = await createClient();
  return supabase
    .from("documents")
    .select(
      "id, name, author, page_count, size, blob_url, current_page, ingested_at",
    )
    .eq("id", id)
    .single();
});

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: doc } = await getDocument(id);

  return {
    title: doc ? formatDocumentName(doc.name) : "Document Not Found",
  };
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const { data: doc, error } = await getDocument(id);

  if (error || !doc) {
    notFound();
  }

  const document: ChatDocument = {
    id: doc.id,
    name: doc.name,
    author: doc.author,
    page_count: doc.page_count,
    size: doc.size,
    blob_url: doc.blob_url,
    current_page: doc.current_page || 1,
    ingested_at: doc.ingested_at,
  };

  return (
    <Suspense>
      <ChatPageClient document={document} />
    </Suspense>
  );
}
