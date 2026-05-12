import { LoginForm } from "@/components/auth/LoginForm";

export default function AdminLoginPage() {
  return <main className="flex min-h-screen items-center bg-background px-4 py-12"><LoginForm type="admin" /></main>;
}
