"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createRedirectPath } from "@/lib/http";
import type { PreparedUpload, PreparedUploadToken } from "@/lib/uploads";

type DashboardFileUploadFormProps = {
  endpoint: string;
  resultPath: string;
  accept: string;
  buttonLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  className?: string;
};

class UploadRequestError extends Error {
  constructor(
    message: string,
    readonly redirectTo?: string,
  ) {
    super(message);
    this.name = "UploadRequestError";
  }
}

async function parseJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string; redirectTo?: string })
    | null;

  if (!response.ok) {
    throw new UploadRequestError(
      payload?.error ?? "Не удалось выполнить загрузку.",
      payload?.redirectTo,
    );
  }

  if (!payload) {
    throw new UploadRequestError("Сервер вернул пустой ответ.");
  }

  return payload;
}

export function DashboardFileUploadForm({
  endpoint,
  resultPath,
  accept,
  buttonLabel,
  pendingLabel,
  disabled = false,
  className,
}: DashboardFileUploadFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);

  function handleOpenPicker() {
    if (disabled || isPending) {
      return;
    }

    inputRef.current?.click();
  }

  async function handleFileChange() {
    const files = Array.from(inputRef.current?.files ?? []);

    if (!files.length) {
      return;
    }

    setIsPending(true);

    try {
      const prepareResponse = await parseJsonResponse<{ uploads: PreparedUpload[] }>(
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intent: "prepare",
            files: files.map((file) => ({
              name: file.name,
              type: file.type,
              size: file.size,
            })),
          }),
        }),
      );
      const uploadTokens: PreparedUploadToken[] = [];

      for (const [index, upload] of prepareResponse.uploads.entries()) {
        const file = files[index];

        if (!file) {
          throw new UploadRequestError("Не удалось сопоставить выбранные файлы.");
        }

        const uploadResponse = await fetch(upload.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": upload.mimeType,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new UploadRequestError("Не удалось загрузить файл в хранилище.");
        }

        uploadTokens.push({
          uploadId: upload.uploadId,
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          sizeBytes: upload.sizeBytes,
        });
      }

      const completeResponse = await parseJsonResponse<{ redirectTo: string }>(
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intent: "complete",
            uploads: uploadTokens,
          }),
        }),
      );

      router.push(completeResponse.redirectTo);
      router.refresh();
    } catch (error) {
      const redirectTo =
        error instanceof UploadRequestError && error.redirectTo
          ? error.redirectTo
          : createRedirectPath(resultPath, {
              error:
                error instanceof Error
                  ? error.message
                  : "Не удалось загрузить файлы.",
            });

      router.push(redirectTo);
      router.refresh();
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setIsPending(false);
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        tabIndex={-1}
        className="sr-only"
        onChange={() => {
          void handleFileChange();
        }}
        disabled={disabled || isPending}
      />
      <Button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled || isPending}
      >
        {isPending ? pendingLabel : buttonLabel}
      </Button>
    </div>
  );
}
