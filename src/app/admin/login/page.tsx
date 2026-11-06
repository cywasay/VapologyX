import type { Metadata } from "next";
import { AdminAuthPage } from "../_shared/AdminAuthPage";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata: Metadata = { title: "Admin log in" };

export default function AdminLoginPage() {
  return <AdminAuthPage title="Welcome back."><AdminLoginForm /></AdminAuthPage>;
}
