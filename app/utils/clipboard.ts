/**
 * @description
 * Writes text to the clipboard and reports whether it succeeded.
 *
 * `navigator.clipboard` is absent in insecure contexts and in several in-app
 * browsers, where reading `.writeText` off it throws synchronously. That means
 * the property access itself has to be guarded — attaching `.catch()` to the
 * returned promise is too late.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
