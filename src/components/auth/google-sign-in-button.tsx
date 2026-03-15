"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  callbackUrl: string;
};

export function GoogleSignInButton({
  callbackUrl,
}: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false);

  function handleClick() {
    setIsPending(true);
    void signIn("google", { callbackUrl });
  }

  return (
    <Button
      type="button"
      className="w-full"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Переходим в Google..." : "Продолжить через Google"}
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  );
}
