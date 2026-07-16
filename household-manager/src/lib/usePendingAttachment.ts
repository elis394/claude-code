import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AttachmentMeta } from "./attachments";

export function usePendingAttachment(onReceive: (meta: AttachmentMeta) => void) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pending = (location.state as { pendingAttachment?: AttachmentMeta } | null)?.pendingAttachment;
    if (pending) {
      onReceive(pending);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);
}
