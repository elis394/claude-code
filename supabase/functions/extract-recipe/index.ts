// Supabase Edge Function: extract-recipe
//
// Given a URL (recipe website, YouTube, TikTok or Instagram), tries to
// pre-fill a recipe: title, image, servings, ingredients and instructions.
// Extraction is best-effort — the app always shows the result in an
// editable form, so a partial or empty result is fine.
//
// Deploy: supabase functions deploy extract-recipe (see SETUP.md)

// deno-lint-ignore-file no-explicit-any

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

type ExtractedIngredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
};

type ExtractResult = {
  title: string;
  imageUrl: string | null;
  servings: number | null;
  instructions: string;
  ingredients: ExtractedIngredient[];
  sourceType: "website" | "video" | "manual";
  rawCaption: string | null;
};

function emptyResult(): ExtractResult {
  return {
    title: "",
    imageUrl: null,
    servings: null,
    instructions: "",
    ingredients: [],
    sourceType: "manual",
    rawCaption: null,
  };
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// --- JSON-LD (schema.org/Recipe) -------------------------------------------

function findRecipeNode(node: any): any | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;

  const type = node["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((t) => typeof t === "string" && t.toLowerCase() === "recipe")) {
    return node;
  }
  if (node["@graph"]) {
    const found = findRecipeNode(node["@graph"]);
    if (found) return found;
  }
  return null;
}

function extractJsonLdRecipe(html: string): any | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html))) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const recipe = findRecipeNode(parsed);
      if (recipe) return recipe;
    } catch {
      // Some sites emit invalid/truncated JSON-LD; skip it.
      continue;
    }
  }
  return null;
}

function textFromMaybeHtml(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenInstructions(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return textFromMaybeHtml(value);
  if (Array.isArray(value)) {
    return value
      .map((step, index) => {
        if (typeof step === "string") return `${index + 1}. ${textFromMaybeHtml(step)}`;
        if (step && typeof step === "object") {
          if (step["@type"] === "HowToSection" && Array.isArray(step.itemListElement)) {
            return flattenInstructions(step.itemListElement);
          }
          const text = step.text ?? step.name;
          return `${index + 1}. ${textFromMaybeHtml(text)}`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function firstImageUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstImageUrl(value[0]);
  if (typeof value === "object" && (value as any).url) return (value as any).url;
  return null;
}

function parseServings(value: unknown): number | null {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") {
    const digits = value.match(/\d+/);
    if (digits) return parseInt(digits[0], 10);
  }
  if (Array.isArray(value)) return parseServings(value[0]);
  return null;
}

const UNIT_WORDS = [
  "g", "gram", "kg", "ml", "l", "liter",
  "el", "eetlepel", "eetlepels", "tl", "theelepel", "theelepels",
  "stuk", "stuks", "stukje", "stukjes",
  "teentje", "teentjes",
  "blikje", "blikjes", "blik",
  "pot", "potje",
  "snufje", "snufjes",
  "handje", "handjes",
  "bosje", "bosjes",
  "plak", "plakken", "plakjes",
  "cup", "cups",
];

function parseIngredientLine(line: string): ExtractedIngredient {
  const cleaned = textFromMaybeHtml(line);
  // e.g. "2 1/2 el olijfolie", "500g kipfilet", "1 ui, gesnipperd"
  const match = cleaned.match(
    new RegExp(
      `^\\s*([\\d.,/]+(?:\\s+[\\d/]+)?)?\\s*(${UNIT_WORDS.join("|")})?\\.?\\s+(.*)$`,
      "i"
    )
  );

  if (match && (match[1] || match[2]) && match[3]) {
    const quantityRaw = match[1]?.trim();
    return {
      name: match[3].trim(),
      quantity: quantityRaw ? parseQuantity(quantityRaw) : null,
      unit: match[2] ? match[2].toLowerCase() : null,
    };
  }

  return { name: cleaned, quantity: null, unit: null };
}

function parseQuantity(raw: string): number | null {
  const parts = raw.split(/\s+/);
  let total = 0;
  let found = false;
  for (const part of parts) {
    if (part.includes("/")) {
      const [num, den] = part.split("/").map(Number);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        total += num / den;
        found = true;
      }
    } else {
      const n = parseFloat(part.replace(",", "."));
      if (!isNaN(n)) {
        total += n;
        found = true;
      }
    }
  }
  return found ? total : null;
}

function extractIngredients(value: unknown): ExtractedIngredient[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((line) => typeof line === "string" && line.trim().length > 0)
    .map((line) => parseIngredientLine(line as string));
}

function recipeFromJsonLd(node: any, url: string): ExtractResult {
  return {
    title: textFromMaybeHtml(node.name) || "",
    imageUrl: firstImageUrl(node.image),
    servings: parseServings(node.recipeYield),
    instructions: flattenInstructions(node.recipeInstructions),
    ingredients: extractIngredients(node.recipeIngredient ?? node.ingredients),
    sourceType: "website",
    rawCaption: null,
  };
}

// --- Open Graph fallback (Instagram / TikTok / anything else) --------------

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractOpenGraph(html: string): { title: string | null; description: string | null; image: string | null } {
  return {
    title: extractMetaContent(html, "og:title"),
    description: extractMetaContent(html, "og:description"),
    image: extractMetaContent(html, "og:image"),
  };
}

// --- oEmbed (YouTube / TikTok) ----------------------------------------------

async function fetchOembed(endpoint: string, url: string): Promise<{ title: string | null; thumbnail: string | null; author: string | null } | null> {
  try {
    const res = await fetch(`${endpoint}?url=${encodeURIComponent(url)}&format=json`, {
      headers: { "User-Agent": BROWSER_USER_AGENT },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      title: json.title ?? null,
      thumbnail: json.thumbnail_url ?? null,
      author: json.author_name ?? null,
    };
  } catch {
    return null;
  }
}

// --- Splitting a video caption into title/ingredients/instructions ---------
//
// TikTok/Instagram have no separate "title" field — the caption is all
// there is. Recipe creators often structure it with headers like
// "Ingredients:" / "Instructions:" (or Dutch equivalents), so we look for
// those instead of dumping the whole caption into the title.

const INGREDIENT_HEADER = /(ingredi[eë]nten?|ingredients?|you.?ll need|wat heb je nodig|benodigdheden)/i;
const INSTRUCTION_HEADER = /(instructions?|bereiding(swijze)?|stappen|steps?|method|directions?|zo maak je|how to make)/i;

function isHeaderLine(line: string, pattern: RegExp): boolean {
  const trimmed = line.trim().replace(/[:：]$/, "");
  if (trimmed.length === 0 || trimmed.length > 40) return false;
  return pattern.test(trimmed);
}

function splitCaptionIntoRecipeParts(caption: string): {
  title: string;
  ingredients: ExtractedIngredient[];
  instructions: string;
} {
  const lines = caption.split(/\r?\n/).map((l) => l.trim());

  const firstLine = lines.find((l) => l.length > 0 && !l.startsWith("#")) ?? "";
  const title = firstLine.length > 80 ? `${firstLine.slice(0, 80).trim()}…` : firstLine;

  const ingredientsStart = lines.findIndex((l) => isHeaderLine(l, INGREDIENT_HEADER));
  if (ingredientsStart === -1) {
    // No recognizable structure — keep the full caption as a starting point.
    return { title, ingredients: [], instructions: caption.trim() };
  }

  const instructionsStart = lines.findIndex(
    (l, i) => i > ingredientsStart && isHeaderLine(l, INSTRUCTION_HEADER)
  );
  const ingredientsEnd = instructionsStart !== -1 ? instructionsStart : lines.length;

  const ingredients = lines
    .slice(ingredientsStart + 1, ingredientsEnd)
    .filter((l) => l.length > 0 && !l.startsWith("#"))
    .map(parseIngredientLine);

  const instructions =
    instructionsStart !== -1
      ? lines
          .slice(instructionsStart + 1)
          .filter((l) => l.length > 0 && !l.startsWith("#"))
          .join("\n")
      : "";

  return { title, ingredients, instructions };
}

// --- Host detection ----------------------------------------------------------

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function extractRecipe(url: string): Promise<ExtractResult> {
  const host = hostOf(url);
  const result = emptyResult();

  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    result.sourceType = "video";
    const oembed = await fetchOembed("https://www.youtube.com/oembed", url);
    if (oembed) {
      result.title = oembed.title ?? "";
      result.imageUrl = oembed.thumbnail;
    }
    return result;
  }

  if (host.includes("tiktok.com")) {
    result.sourceType = "video";
    const [oembed, html] = await Promise.all([
      fetchOembed("https://www.tiktok.com/oembed", url),
      fetchHtml(url),
    ]);
    if (oembed?.thumbnail) result.imageUrl = oembed.thumbnail;

    const og = html ? extractOpenGraph(html) : null;
    if (og?.image && !result.imageUrl) result.imageUrl = og.image;

    // TikTok has no real "title" — oEmbed's title and the OG description are
    // both just the caption. Prefer the (usually fuller) OG description.
    const caption = og?.description || oembed?.title || "";
    if (caption) {
      result.rawCaption = caption;
      const parsed = splitCaptionIntoRecipeParts(caption);
      result.title = parsed.title;
      result.ingredients = parsed.ingredients;
      result.instructions = parsed.instructions;
    } else if (oembed?.title) {
      result.title = oembed.title;
    }
    return result;
  }

  if (host.includes("instagram.com")) {
    result.sourceType = "video";
    const html = await fetchHtml(url);
    if (html) {
      const og = extractOpenGraph(html);
      result.imageUrl = og.image;
      if (og.description) {
        result.rawCaption = og.description;
        const parsed = splitCaptionIntoRecipeParts(og.description);
        result.title = parsed.title;
        result.ingredients = parsed.ingredients;
        result.instructions = parsed.instructions;
      } else if (og.title) {
        result.title = og.title;
      }
    }
    return result;
  }

  // Generic website: try JSON-LD Recipe first, then fall back to Open Graph.
  const html = await fetchHtml(url);
  if (!html) return result;

  const recipeNode = extractJsonLdRecipe(html);
  if (recipeNode) {
    return recipeFromJsonLd(recipeNode, url);
  }

  const og = extractOpenGraph(html);
  result.sourceType = "website";
  result.title = og.title ?? "";
  result.imageUrl = og.image;
  if (og.description) {
    result.rawCaption = og.description;
    result.instructions = og.description;
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'url' in request body" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const result = await extractRecipe(url);

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
