import { SessionsScreen } from "@/features/sessions/components/sessions-screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;
  return (
    <SessionsScreen
      userId={userId && /^[a-zA-Z0-9]+$/.test(userId) ? userId : undefined}
    />
  );
}
