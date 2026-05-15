"use client";

import { Calendar, CreditCard, LayoutDashboard, Receipt, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getWorkerPayslip } from "@/lib/api";
import { unwrapData } from "@/lib/utils";
import SidebarBase from "./SidebarBase";

const nav = [
  { label: "Check-In", href: "/worker/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/worker/attendance", icon: Calendar },
  { label: "Payslip", href: "/worker/payslip", icon: Receipt },
  { label: "Profile", href: "/worker/profile", icon: User },
  { label: "Bank Account", href: "/worker/bank", icon: CreditCard },
];

export function SidebarWorker() {
  const { user } = useAuth();
  const [hasPaidPayslip, setHasPaidPayslip] = useState(false);
  const workerName = `${String(user?.first_name || "Worker")} ${String(user?.last_name || "")}`.trim();

  useEffect(() => {
    getWorkerPayslip()
      .then((response) => {
        const data = unwrapData<any>(response);
        const payslip = data.payslip || data;
        setHasPaidPayslip(payslip?.squad_status === "PAID" || payslip?.status === "PAID");
      })
      .catch(() => setHasPaidPayslip(false));
  }, []);

  const navWithBadge = nav.map((item) => item.href === "/worker/payslip" ? { ...item, dot: hasPaidPayslip } : item);

  return (
    <SidebarBase
      portal="worker"
      userName={workerName}
      userRole={String((user?.roles as any)?.role_name || "Worker")}
      navItems={navWithBadge}
      logoutPath="/worker/login"
    />
  );
}
