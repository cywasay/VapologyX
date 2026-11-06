import type { Metadata } from "next";
import { LoginForm } from "./_sections/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <LoginForm />;
}
