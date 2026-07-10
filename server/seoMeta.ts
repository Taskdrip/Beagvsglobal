import { storage } from "./storage";

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absoluteUrl(baseUrl: string, maybeRelative: string): string {
  if (!maybeRelative) return maybeRelative;
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  const base = baseUrl.replace(/\/$/, "");
  const path = maybeRelative.startsWith("/") ? maybeRelative : `/${maybeRelative}`;
  return `${base}${path}`;
}

function replaceMetaTag(html: string, matcher: RegExp, replacement: string): string {
  if (matcher.test(html)) {
    return html.replace(matcher, replacement);
  }
  // Tag not present in the template — append right before </head>
  return html.replace("</head>", `    ${replacement}\n  </head>`);
}

/**
 * For /blog/:slug requests, replace the static Open Graph / Twitter / title meta
 * tags in index.html with the actual blog post's title, summary, and featured
 * image — server-side, before the HTML reaches the client.
 *
 * This is required because social platforms (Facebook, X/Twitter, LinkedIn,
 * WhatsApp) fetch the page with crawlers that do NOT execute JavaScript. The
 * app previously only set these tags client-side (via useEffect), so shared
 * links always showed the generic homepage title/image instead of the post's.
 */
export async function injectBlogPostMeta(
  html: string,
  reqPath: string,
  baseUrl: string
): Promise<string> {
  const match = reqPath.match(/^\/blog\/([^/?#]+)/);
  if (!match) return html;

  const slug = decodeURIComponent(match[1]);

  try {
    const post = await storage.getBlogPost(slug);
    if (!post || !post.published) return html;

    const title = escapeHtml(`${post.ogTitle || post.title} | Beagvs Global Blog`);
    const description = escapeHtml(
      post.ogDescription || post.metaDescription || post.excerpt || ""
    );
    const image = post.coverImageUrl
      ? absoluteUrl(baseUrl, post.coverImageUrl)
      : `${baseUrl.replace(/\/$/, "")}/og-image.png`;
    const url = `${baseUrl.replace(/\/$/, "")}/blog/${post.slug}`;

    let result = html;
    result = replaceMetaTag(result, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
    result = replaceMetaTag(
      result,
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${description}" />`
    );
    result = replaceMetaTag(
      result,
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${url}" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:type" content="article" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${url}" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:title" content="${title}" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:description" content="${description}" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
      `<meta property="og:image" content="${image}" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:card" content="summary_large_image" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:url" content="${url}" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:title" content="${title}" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:description" content="${description}" />`
    );
    result = replaceMetaTag(
      result,
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
      `<meta name="twitter:image" content="${image}" />`
    );

    return result;
  } catch (err) {
    console.error("[seoMeta] Failed to inject blog post meta tags:", err);
    return html;
  }
}

export function getRequestBaseUrl(req: { protocol: string; get(name: string): string | undefined }): string {
  const host = req.get("host") || "beagvsmarine.com";
  return `${req.protocol}://${host}`;
}
