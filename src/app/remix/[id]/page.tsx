import { notFound } from "next/navigation";
import { getContentById } from "@/services/content-service";
import { RemixForm } from "./remix-form";
import type { Metadata } from "next";

interface RemixPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: RemixPageProps): Promise<Metadata> {
  const { id } = await params;
  const content = await getContentById(id);

  if (!content) {
    return { title: "Not Found — ABox" };
  }

  return {
    title: `Remix "${content.title}" — ABox`,
    description: `Remix ${content.title} by ${content.creator.username}`,
  };
}

export default async function RemixPage({ params }: RemixPageProps) {
  const { id } = await params;
  const parent = await getContentById(id);

  if (!parent) {
    notFound();
  }

  return <RemixForm parent={parent} />;
}
