"use client";

import { useSyncExternalStore } from "react";

import { PHONE_MEDIA } from "./phone-media";

let media: MediaQueryList | undefined;
export const phoneMedia = () => media ??= window.matchMedia(PHONE_MEDIA);

function subscribe(onChange: () => void) {
  const query = phoneMedia();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function usePhoneLayout() {
  return useSyncExternalStore(subscribe, () => phoneMedia().matches, () => false);
}
