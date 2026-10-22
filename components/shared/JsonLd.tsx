/**
 * Renders a JSON-LD block. `<` is escaped so no string inside the data can close the
 * script tag early, which keeps it inert even if content ever comes from elsewhere.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
