import type { Metadata } from "next";
import { AdminAuthPage } from "../_shared/AdminAuthPage";
import { AdminForgotForm } from "./AdminForgotForm";

export const metadata: Metadata = { title: "Admin forgot password" };

export default function AdminForgotPasswordPage() {
  return <AdminAuthPage title="Locked out?"><AdminForgotForm /></AdminAuthPage>;
}
