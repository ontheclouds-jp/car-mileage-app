import { LogEditClient } from "@/components/logs/LogEditClient";

export default async function LogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LogEditClient id={id} />;
}
