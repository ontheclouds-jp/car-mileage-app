import { LogDetailClient } from "@/components/logs/LogDetailClient";

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LogDetailClient id={id} />;
}
