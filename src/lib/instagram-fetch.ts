// Instagram's CDN blocks Supabase's server-side fetch (datacenter IP + a
// non-browser TLS fingerprint), but a real device's own network request
// works the same as any other browser's — so for Instagram specifically,
// the app fetches the page itself and only sends the parsed caption text
// to the extract-recipe function. Native only: browsers refuse this via
// CORS, so on web it silently returns null and the caller falls back to
// the (equally blocked) server-side fetch, same as before this existed.

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function metaContent(html: string, property: string): string | null {
  const match = html.match(new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`, 'i'));
  return match ? decodeHtmlEntities(match[1]) : null;
}

// Strips Instagram's own "<n> likes, <n> comments - <user> on <date>:
// "<caption>"" wrapper around the real caption in og:description.
function stripInstagramMetaPrefix(text: string): string {
  return text.replace(/^[\d,]+\s+likes?,\s+[\d,]+\s+comments?\s+-\s+.+?\s+on\s+.+?:\s*/i, '');
}

export async function tryFetchInstagramCaption(
  url: string
): Promise<{ rawCaption: string; imageUrl: string | null } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const html = await res.text();
    const description = metaContent(html, 'og:description');
    if (!description) return null;
    return {
      rawCaption: stripInstagramMetaPrefix(description),
      imageUrl: metaContent(html, 'og:image'),
    };
  } catch {
    return null;
  }
}
