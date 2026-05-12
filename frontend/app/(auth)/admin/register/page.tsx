import Link from "next/link";
import { AdminRegisterForm } from "@/components/auth/AdminRegisterForm";

export default function AdminRegisterPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="text-2xl font-bold text-brand-dark">GhostGuard</Link>
        <h1 className="mt-6 text-3xl font-bold">Create your admin account</h1>
      </div>
      <AdminRegisterForm />
    </main>
  );
}
