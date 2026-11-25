export function loginErrorKey(error: {
  message: string;
  status: number | null;
}): string {
  switch (error.message) {
    case "INVALID_ORIGIN":
      return "invalidOrigin";
    case "ADMIN_REQUIRED":
      return "adminRequired";
    case "POLICY_ACCEPTANCE_REQUIRED":
      return "policyError";
    case "ADMIN_UNAVAILABLE":
      return "adminUnavailable";
    case "ADMIN_SESSION_INVALID":
      return "adminSessionInvalid";
    case "CORE_UNAVAILABLE":
      return "unavailable";
    default:
      return error.status === 503 || error.status === null
        ? "unavailable"
        : "loginError";
  }
}
