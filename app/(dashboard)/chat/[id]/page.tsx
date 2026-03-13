import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDocumentName } from "@/lib/utils";
import { ChatPageClient } from "./chat-page-client";
import type { ChatDocument } from "./types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: doc ? formatDocumentName(doc.name) : "Document Not Found",
  };
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, name, author, page_count, size, blob_url")
    .eq("id", id)
    .single();

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
  };

  return <ChatPageClient document={document} />;
}
