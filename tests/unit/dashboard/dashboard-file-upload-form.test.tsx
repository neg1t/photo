import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DashboardFileUploadForm } from "@/components/dashboard/dashboard-file-upload-form";

describe("DashboardFileUploadForm", () => {
  it("opens the file picker when the button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DashboardFileUploadForm
        action="/dashboard/collections/demo/upload"
        inputName="photos"
        accept="image/jpeg,image/png,image/webp"
        buttonLabel="Загрузить фото"
        pendingLabel="Загружаем фото..."
      />,
    );

    const input = container.querySelector('input[type="file"]');

    if (!input) {
      throw new Error("File input not found");
    }

    const clickSpy = vi.spyOn(input, "click");

    await user.click(screen.getByRole("button", { name: "Загрузить фото" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("submits the form automatically after files are selected", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DashboardFileUploadForm
        action="/dashboard/collections/demo/upload"
        inputName="photos"
        accept="image/jpeg,image/png,image/webp"
        buttonLabel="Загрузить фото"
        pendingLabel="Загружаем фото..."
      />,
    );

    const form = container.querySelector("form");
    const input = container.querySelector('input[type="file"]');

    if (!form || !input) {
      throw new Error("Upload form markup not found");
    }

    const requestSubmit = vi.fn();
    Object.defineProperty(form, "requestSubmit", {
      value: requestSubmit,
      configurable: true,
    });

    await user.upload(
      input as HTMLInputElement,
      new File(["demo"], "demo.jpg", { type: "image/jpeg" }),
    );

    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Загружаем фото..." }),
    ).toBeDisabled();
  });

  it("does not submit the form when file selection is canceled", () => {
    const { container } = render(
      <DashboardFileUploadForm
        action="/dashboard/collections/demo/upload"
        inputName="photos"
        accept="image/jpeg,image/png,image/webp"
        buttonLabel="Загрузить фото"
        pendingLabel="Загружаем фото..."
      />,
    );

    const form = container.querySelector("form");
    const input = container.querySelector('input[type="file"]');

    if (!form || !input) {
      throw new Error("Upload form markup not found");
    }

    const requestSubmit = vi.fn();
    Object.defineProperty(form, "requestSubmit", {
      value: requestSubmit,
      configurable: true,
    });
    Object.defineProperty(input, "files", {
      value: [],
      configurable: true,
    });

    fireEvent.change(input);

    expect(requestSubmit).not.toHaveBeenCalled();
  });
});
