"use client";

import { Loader } from "@/components/loader/Loader";
import { useAccount } from "../../_shared/account";
import { PasswordCard } from "./PasswordCard";
import { ProfileCard } from "./ProfileCard";

export function SettingsView() {
  const { account, setAvatar } = useAccount();
  if (account === undefined) return <Loader label="Loading your account" />;
  if (account === null) return <p className="admin-note">We couldn&apos;t load your account. Please refresh the page or log in again.</p>;
  return <div className="settings-grid">
    <ProfileCard account={account} onAvatarChange={setAvatar} />
    <PasswordCard account={account} />
  </div>;
}
