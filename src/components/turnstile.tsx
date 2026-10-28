"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opciones: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark";
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Widget de Cloudflare Turnstile. Entrega el token por onToken (o null si vence).
export function Turnstile({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const alToken = useRef(onToken);

  useEffect(() => {
    alToken.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let widget: string | undefined;
    let cancelado = false;

    function montar() {
      if (cancelado || !contenedor.current || !window.turnstile) return;
      widget = window.turnstile.render(contenedor.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => alToken.current(token),
        "expired-callback": () => alToken.current(null),
      });
    }

    if (window.turnstile) {
      montar();
    } else {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = montar;
      document.head.appendChild(script);
    }

    return () => {
      cancelado = true;
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [siteKey]);

  return <div ref={contenedor} />;
}
