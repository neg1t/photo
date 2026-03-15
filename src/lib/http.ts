export function createRedirectPath(
  pathname: string,
  options?: {
    error?: string;
    success?: string;
  },
) {
  const params = new URLSearchParams();

  if (options?.error) {
    params.set("error", options.error);
  }

  if (options?.success) {
    params.set("success", options.success);
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function createSeeOtherRedirectResponse(
  request: Request,
  pathname: string,
  options?: {
    error?: string;
    success?: string;
  },
) {
  return Response.redirect(
    new URL(createRedirectPath(pathname, options), request.url),
    303,
  );
}
