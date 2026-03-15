"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type DashboardFileUploadFormProps = {
  action: string;
  inputName: string;
  accept: string;
  buttonLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  className?: string;
};

export function DashboardFileUploadForm({
  action,
  inputName,
  accept,
  buttonLabel,
  pendingLabel,
  disabled = false,
  className,
}: DashboardFileUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);

  function handleOpenPicker() {
    if (disabled || isPending) {
      return;
    }

    inputRef.current?.click();
  }

  function handleFileChange() {
    const files = inputRef.current?.files;

    if (!files?.length) {
      return;
    }

    setIsPending(true);
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      action={action}
      method="post"
      encType="multipart/form-data"
      className={className}
    >
      <input
        ref={inputRef}
        type="file"
        name={inputName}
        accept={accept}
        multiple
        tabIndex={-1}
        className="sr-only"
        onChange={handleFileChange}
        disabled={disabled || isPending}
      />
      <Button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled || isPending}
      >
        {isPending ? pendingLabel : buttonLabel}
      </Button>
    </form>
  );
}
