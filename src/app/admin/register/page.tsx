import type { Metadata } from "next";
import Link from "next/link";
import { AdminAuthPage } from "../_shared/AdminAuthPage";

export const metadata: Metadata = { title: "Admin register" };

// Admin accounts are never open to the public. They are created by the shop owner, so this page only explains how to get one.
export default function AdminRegisterPage() {
  return <AdminAuthPage title="Join the team.">
    <div className="panel-light form-panel auth-form">
      <h2>Admin accounts are invite-only</h2>
      <p>Ask the shop owner to create an account for you. Once it exists, you can log in here.</p>
      <Link className="button button-primary" href="/admin/login">Go to admin log in</Link>
      <Link className="text-link" href="/">Back to the store</Link>
    </div>
  </AdminAuthPage>;
}
