import { redirect } from "next/navigation";
import { currentAdmin } from "@/base/api/server";
import { LoginForm } from "@/features/auth/components/login-form";
export default async function LoginPage() {
  const identity = await currentAdmin();
  if (identity.status === 200) redirect("/");
  return <LoginForm />;
}
