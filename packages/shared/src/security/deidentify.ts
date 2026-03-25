// Minimal PHI redaction for MVP.
// In production, use a clinical-grade de-identification pipeline.
export function deidentifyText(text: string): string {
  return text
    // Emails
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    // Phone numbers (very rough)
    .replace(/(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}/g, "[REDACTED_PHONE]")
    // Long numbers (e.g., IDs)
    .replace(/\b\d{8,}\b/g, "[REDACTED_ID]");
}

