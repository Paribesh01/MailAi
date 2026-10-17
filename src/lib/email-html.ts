export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Turn plain text typed by the user into safe email HTML, optionally appending their signature. */
export function textToEmailHtml(text: string, signature?: string | null): string {
  const full = signature?.trim() && !text.includes(signature.trim())
    ? `${text.trimEnd()}\n\n${signature.trim()}`
    : text
  return `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${escapeHtml(full).replace(/\r?\n/g, "<br>")}</div>`
}
