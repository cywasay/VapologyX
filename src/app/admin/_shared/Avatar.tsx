import Image from "next/image";
import type { Account } from "./account";

export function Avatar({ account, size }: { account: Account | null | undefined; size: number }) {
  if (account?.avatarUrl) return <Image className="admin-avatar" src={account.avatarUrl} alt="" width={size} height={size} unoptimized />;
  return <span className="admin-avatar" style={{ width: size, height: size, fontSize: size * .42 }} aria-hidden="true">{account?.email.charAt(0).toUpperCase() ?? ""}</span>;
}
