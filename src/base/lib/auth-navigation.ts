/** A full reload clears the previous account's client state and rechecks the server layout. */
export function navigateAfterAuth(path: "/" | "/login") {
  window.location.assign(path);
}
