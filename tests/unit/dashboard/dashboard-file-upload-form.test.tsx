import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

import { DashboardFileUploadForm } from "@/components/dashboard/dashboard-file-upload-form";

describe("DashboardFileUploadForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("opens the file picker when the button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DashboardFileUploadForm
        endpoint="/dashboard/collections/demo/upload"
        resultPath="/dashboard/collections"
        accept="image/jpeg,image/png,image/webp"
        buttonLabel="Загрузить фото"
        pendingLabel="Загружаем фото..."
      />,
    );

    const input = container.querySelector('input[type="file"]');

    if (!input) {
      throw new Error("File input not found");
    }

    const clickSpy = vi.spyOn(input as HTMLInputElement, "click");

    await user.click(screen.getByRole("button", { name: "Загрузить фото" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("uploads selected files via signed urls and redirects to the success banner", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            uploads: [
              {
                uploadId: "upload-1",
                fileName: "demo.jpg",
                mimeType: "image/jpeg",
                sizeBytes: 4,
                uploadUrl: "https://storage.example/upload-1",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            redirectTo:
              "/dashboard/collections?success=%D0%A4%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

    const { container } = render(
      <DashboardFileUploadForm
        endpoint="/dashboard/collections/demo/upload"
        resultPath="/dashboard/collections"
        accept="image/jpeg,image/png,image/webp"
        buttonLabel="Загрузить фото"
        pendingLabel="Загружаем фото..."
      />,
    );

    const input = container.querySelector('input[type="file"]');

    if (!input) {
      throw new Error("Upload input markup not found");
    }

    await user.upload(
      input as HTMLInputElement,
      new File(["demo"], "demo.jpg", { type: "image/jpeg" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/dashboard/collections/demo/upload",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://storage.example/upload-1",
      expect.objectContaining({
        method: "PUT",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/dashboard/collections/demo/upload",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(pushMock).toHaveBeenCalledWith(
      "/dashboard/collections?success=%D0%A4%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8",
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does not start upload when file selection is canceled", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { container } = render(
      <DashboardFileUploadForm
        endpoint="/dashboard/collections/demo/upload"
        resultPath="/dashboard/collections"
        accept="image/jpeg,image/png,image/webp"
        buttonLabel="Загрузить фото"
        pendingLabel="Загружаем фото..."
      />,
    );

    const input = container.querySelector('input[type="file"]');

    if (!input) {
      throw new Error("Upload input markup not found");
    }

    Object.defineProperty(input, "files", {
      value: [],
      configurable: true,
    });

    fireEvent.change(input);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
