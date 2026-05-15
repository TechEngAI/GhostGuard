"use client";

import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export function useDeviceFingerprint() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => setDeviceId(result.visitorId))
      .catch(() => setDeviceId("unknown"));
  }, []);

  return deviceId;
}
