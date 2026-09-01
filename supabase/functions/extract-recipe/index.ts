// Supabase Edge Function: extract-recipe
//
// Input: POST JSON { url: string }
// Output: JSON { title, imageUrl, servings, instructions, ingredients, sourceType, rawCaption }
//
// Extraction is best-effort: partial/empty results are fine.

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

function normalizeWhitespace(s: string): string {
  return s.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
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

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// -------------------- JSON-LD Recipe parsing -------------------------------

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

function extractJsonLdRecipes(html: string): any[] {
  const results: any[] = [];
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html))) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      // JSON-LD can be object or array.
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          const found = findRecipeNode(p);
          if (found) results.push(found);
        }
      } else {
        const found = findRecipeNode(parsed);
        if (found) results.push(found);
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return results;
}

function firstImageUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstImageUrl(value[0]);
  if (typeof value === "object" && value && (value as any).url) return (value as any).url;
  return null;
}

function parseServings(value: unknown): number | null {
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") {
    const m = value.match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
  }
  if (Array.isArray(value)) return parseServings(value[0]);
  return null;
}

function flattenInstructions(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return normalizeWhitespace(stripHtmlTags(decodeHtmlEntities(value)));
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (const step of value) {
      if (typeof step === "string") {
        const t = normalizeWhitespace(stripHtmlTags(decodeHtmlEntities(step)));
        if (t) parts.push(t);
      } else if (step && typeof step === "object") {
        if (step.itemListElement) {
          // HowToSection: recurse into its steps rather than using the
          // section's own name as if it were a step.
          const nested = flattenInstructions(step.itemListElement);
          if (nested) parts.push(nested);
          continue;
        }
        const maybeText = (step.text ?? step.name);
        const t = typeof maybeText === "string" ? normalizeWhitespace(stripHtmlTags(decodeHtmlEntities(maybeText))) : "";
        if (t) parts.push(t);
      }
    }
    return parts.join("\n");
  }
  // recipeInstructions can be an object with itemListElement, etc.
  if (typeof value === "object" && value) {
    const maybe = (value as any).itemListElement;
    if (maybe) return flattenInstructions(maybe);
  }
  return "";
}

function extractJsonLdRecipe(html: string): { node: any; } | null {
  const recipes = extractJsonLdRecipes(html);
  if (recipes.length === 0) return null;
  return { node: recipes[0] };
}

// -------------------- Open Graph fallback --------------------------------

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1] ?? "");
  }
  return null;
}

function extractOpenGraph(html: string): { title: string | null; description: string | null; image: string | null } {
  return {
    title: extractMetaContent(html, "og:title"),
    description: extractMetaContent(html, "og:description"),
    image: extractMetaContent(html, "og:image"),
  };
}

// -------------------- oEmbed (YouTube / TikTok) ----------------------------

async function fetchOembed(endpoint: string, url: string): Promise<{ title: string | null; thumbnail: string | null } | null> {
  try {
    const res = await fetch(`${endpoint}?url=${encodeURIComponent(url)}&format=json`, {
      headers: { "User-Agent": BROWSER_USER_AGENT },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      title: json.title ?? null,
      thumbnail: json.thumbnail_url ?? json.thumbnail ?? null,
    };
  } catch {
    return null;
  }
}

// -------------------- Caption parsing for TikTok/Instagram ----------------

function normalizeCaption(text: string): string {
  // Keep line breaks intact — normalizeWhitespace alone collapses them,
  // which would flatten a caption's real structure before anything
  // downstream ever gets a chance to split on it.
  return normalizeWhitespacePreservingLines(stripHtmlTags(text));
}

function deriveTitle(text: string): string {
  const cleaned = normalizeWhitespace(text);
  if (!cleaned) return "";
  // Captions/descriptions with no line breaks would otherwise hand their
  // entire text to the title field — cap it to a short preview instead.
  return cleaned.length > 80 ? `${cleaned.slice(0, 80).trim()}…` : cleaned;
}

// Recognizes a line as a bullet-list item ("- 250 ml milk", "• 2 eggs").
function isBulletLine(line: string): boolean {
  return /^[-–—•]\s*\S/.test(line);
}

// Many captions never label their ingredients at all ("Recipe for 8 buns:"
// followed directly by a "- item" list, then plain prose for the method) —
// find the ingredient block by its bullet-list shape instead of a heading.
function findBulletRun(lines: string[]): { start: number; end: number } | null {
  const start = lines.findIndex(isBulletLine);
  if (start === -1) return null;
  let end = start;
  while (end + 1 < lines.length && isBulletLine(lines[end + 1])) end++;
  // Require at least two bullet lines so a single stray "-" elsewhere in
  // the caption doesn't get mistaken for an ingredient list.
  return end > start ? { start, end } : null;
}

function parseServingsFromText(text: string): number | null {
  const patterns = [
    /\bfor\s+(\d+)(?:\s*[-–]\s*\d+)?\s+(?:people|persons|servings|buns|rolls|pieces|portions)\b/i,
    /\bserves?\s+(\d+)/i,
    /\byields?\s+(\d+)/i,
    /\bvoor\s+(\d+)(?:\s*[-–]\s*\d+)?\s+(?:personen|porties)\b/i,
    /(\d+)(?:\s*[-–]\s*\d+)?\s+porties\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

// Shared quantity pattern: "2", "2.5", "2,5", "1/2", "2 1/2" — mixed and
// plain fractions must be tried before the plain-integer alternative, or the
// regex engine settles for matching just the "2" in "2 1/2". Hoisted to
// module scope so both `parseIngredientLine` and the run-on-caption helpers
// below share one definition.
const QTY_RE_SOURCE = "(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:[\\.,]\\d+)?)";

// Some captions have no headings and no bullet list at all — just
// "quantity unit name" tokens run together with plain spaces, e.g.
// "25 g unsalted butter 20 ml sunflower oil 600 g chicken thighs...".
// Locate where that run starts: the first quantity token standing alone
// between whitespace. Everything before it (title, hashtags, an intro
// section label) is discarded, same as the other fallback tiers.
function findFirstQuantityIndex(text: string): number {
  const re = new RegExp(`(?<=^|\\s)${QTY_RE_SOURCE}(?=\\s)`, "u");
  const m = re.exec(text);
  return m ? m.index : -1;
}

// Common instruction-step verbs (EN + NL). Used to detect where a run-on
// ingredient list turns into prose instructions: ingredients are short,
// period-free phrases, instruction steps are full sentences that typically
// open with one of these.
const INSTRUCTION_VERBS = [
  "Heat", "Add", "Mix", "Combine", "Bake", "Preheat", "Cook", "Stir", "Place", "Pour",
  "Fry", "Cover", "Let", "Remove", "Serve", "Whisk", "Chop", "Cut", "Slice", "Roll",
  "Knead", "Spread", "Melt", "Boil", "Simmer", "Season", "Sprinkle", "Drizzle",
  "Transfer", "Set", "Repeat", "Divide", "Shape", "Chill", "Refrigerate", "Warm",
  "Beat", "Fold", "Garnish", "Top", "Assemble", "Layer", "Bring", "Reduce", "Grease",
  "Line", "Arrange", "Rest", "Start", "Meanwhile",
  "Verwarm", "Voeg", "Meng", "Bak", "Kook", "Roer", "Snijd", "Giet", "Laat", "Serveer",
  "Bestrooi", "Verdeel", "Kneed", "Rol", "Smelt", "Breng", "Haal", "Doe", "Zet",
];

function findProseInstructionStart(text: string, fromIndex: number): number {
  const verbAlt = INSTRUCTION_VERBS.map(escapeRegExp).join("|");
  const re = new RegExp(`(?:^|[.!?]\\s|\\s)(${verbAlt})\\b[^.?!]{10,}?[.?!]`, "gu");
  re.lastIndex = fromIndex;
  const m = re.exec(text);
  if (!m) return -1;
  return m.index + m[0].indexOf(m[1]);
}

// Turns a run-on ingredient blob ("25 g unsalted butter 20 ml sunflower
// oil ... DOUGH 350 g all-purpose flour ...") into one ingredient per line.
function splitRunOnIngredientBlob(blob: string): string {
  // Drop parenthetical asides ("(1⅔ tsp)") — usually a redundant unit
  // conversion for a quantity already captured before the parens.
  let text = blob.replace(/\([^)]*\)/g, " ");

  // Isolate short ALL-CAPS section labels ("DOUGH", "EXTRA", "CHICKEN
  // MIXTURE") on their own line so they don't glue onto the ingredient
  // before or after them; they get dropped entirely below.
  text = text.replace(/(?<![A-Z])([A-Z]{2,}(?:\s+[A-Z]{2,}){0,2})(?![A-Za-z])/g, "\n$1\n");

  // Break before every remaining quantity token so each ingredient gets
  // its own line.
  const qtyBoundary = new RegExp(`(?<=\\s)(?=${QTY_RE_SOURCE}(?:\\s|$))`, "g");
  text = text.replace(qtyBoundary, "\n");

  const lines = text
    .split("\n")
    .map((l) => normalizeWhitespace(l))
    .filter((l) => l && !/^[A-Z]{2,}(?:\s+[A-Z]{2,}){0,2}$/.test(l));

  return lines.join("\n");
}

function splitTitleIngredientsInstructionsFromCaption(caption: string): {
  title: string;
  ingredientsText: string | null;
  instructionsText: string | null;
  servings: number | null;
} {
  const text = caption.replace(/\r\n/g, "\n");
  const lines = text.split(/\n+/).map((l) => normalizeWhitespace(l)).filter(Boolean);
  const firstLine = deriveTitle(lines[0] ?? "");
  const servings = parseServingsFromText(text);

  const joined = lines.join("\n");

  const ingIndex = findHeadingIndex(joined, ["Ingredients", "Ingrediënten"]);
  const instrIndex = findHeadingIndex(joined, ["Instructions", "Bereiding", "Bereidingswijze"]);

  // Steps are often written as "- step one - step two" instead of one per
  // line — split those into separate lines so they read as actual steps.
  const formatInstructions = (value: string): string | null => {
    const stepped = splitBulletItems(value).join("\n");
    return stepped || null;
  };

  if (ingIndex !== -1 && instrIndex !== -1 && instrIndex > ingIndex) {
    const ingSection = joined.slice(ingIndex, instrIndex).trim();
    const instrSection = joined.slice(instrIndex).trim();

    const ingredientsText = stripHeading(ingSection, ["Ingredients", "Ingrediënten"]);
    const instructionsText = stripHeading(instrSection, ["Instructions", "Bereiding", "Bereidingswijze"]);

    return {
      title: firstLine,
      ingredientsText: ingredientsText || null,
      instructionsText: formatInstructions(instructionsText),
      servings,
    };
  }

  if (ingIndex !== -1) {
    const ingSection = joined.slice(ingIndex).trim();
    const ingredientsText = stripHeading(ingSection, ["Ingredients", "Ingrediënten"]);
    return {
      title: firstLine,
      ingredientsText: ingredientsText || null,
      instructionsText: null,
      servings,
    };
  }

  if (instrIndex !== -1) {
    const instrSection = joined.slice(instrIndex).trim();
    const instructionsText = stripHeading(instrSection, ["Instructions", "Bereiding", "Bereidingswijze"]);
    return {
      title: firstLine,
      ingredientsText: null,
      instructionsText: formatInstructions(instructionsText),
      servings,
    };
  }

  // No explicit headings at all — fall back to locating the ingredient
  // list by its bullet shape.
  const bulletRun = findBulletRun(lines);
  if (bulletRun) {
    const ingredientsText = lines.slice(bulletRun.start, bulletRun.end + 1).join("\n");
    const instructionsText = lines.slice(bulletRun.end + 1).join("\n");
    return {
      title: firstLine,
      ingredientsText: ingredientsText || null,
      instructionsText: formatInstructions(instructionsText),
      servings,
    };
  }

  // No headings, no bullets — ingredients may be a run-on "quantity unit
  // name" sequence with plain spaces instead of any delimiter. Find where
  // that run starts and where prose instructions take over.
  const ingStart = findFirstQuantityIndex(joined);
  if (ingStart !== -1) {
    const proseStart = findProseInstructionStart(joined, ingStart);
    if (proseStart > ingStart) {
      const ingredientsText = splitRunOnIngredientBlob(joined.slice(ingStart, proseStart));
      const instructionsText = joined.slice(proseStart).trim();
      return {
        title: firstLine,
        ingredientsText: ingredientsText || null,
        instructionsText: formatInstructions(instructionsText),
        servings,
      };
    }
  }

  return {
    title: firstLine,
    ingredientsText: null,
    instructionsText: formatInstructions(joined),
    servings,
  };
}

function findHeadingIndex(text: string, headings: string[]): number {
  let best = -1;
  for (const h of headings) {
    // Match the heading wherever it stands as its own word — not just at
    // the start of a line. Social captions commonly prefix it with an
    // emoji/checkmark instead of a real line break, and don't always
    // follow it with a colon.
    const re = new RegExp(`(?<![\\p{L}])${escapeRegExp(h)}\\b\\s*:?`, "iu");
    const m = re.exec(text);
    if (m && typeof m.index === "number") {
      if (best === -1 || m.index < best) best = m.index;
    }
  }
  return best;
}

// normalizeWhitespace collapses newlines too, which would flatten a
// properly line-broken ingredient/step list into one unsplittable blob —
// clean each line individually instead, keeping the line breaks intact.
function normalizeWhitespacePreservingLines(text: string): string {
  return text
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .join("\n");
}

function stripHeading(sectionText: string, headings: string[]): string {
  let out = sectionText;
  for (const h of headings) {
    const re = new RegExp(`(?<![\\p{L}])${escapeRegExp(h)}\\b\\s*:?`, "iu");
    out = out.replace(re, "");
  }
  return normalizeWhitespacePreservingLines(out);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

// -------------------- Ingredient parsing + unit conversion --------------

const METRIC_UNITS: Record<string, string> = {
  g: "g",
  gram: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  liter: "l",
  el: "el",
  eetlepel: "el",
  eetlepels: "el",
  tl: "tl",
  theelepel: "tl",
  theelepels: "tl",
  stuk: "stuk",
  stuks: "stuks",
  stukjes: "stukjes",
  stukje: "stukje",
  teentje: "teentje",
  teentjes: "teentjes",
  snufje: "snufje",
  snufjes: "snufjes",
  handje: "handje",
  handjes: "handjes",
  bosje: "bosje",
  bosjes: "bosjes",
  blikje: "blikje",
  blikjes: "blikjes",
  potje: "potje",
  pot: "pot",
  plak: "plak",
  plakken: "plakken",
  plakjes: "plakjes",
  cup: "cup",
  cups: "cup",
  tbsp: "tbsp",
  tbsps: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  tsps: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pint: "pint",
  pints: "pint",
  quart: "quart",
  quarts: "quart",
  gallon: "gallon",
  gallons: "gallon",
};

function parseNumberMaybe(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  // handle fractions like 1/2
  if (t.includes("/")) {
    const [a, b] = t.split("/").map((x) => x.trim());
    const n = Number(a.replace(",", "."));
    const d = Number(b.replace(",", "."));
    if (isFinite(n) && isFinite(d) && d !== 0) return n / d;
  }
  const n = Number(t.replace(",", "."));
  return isFinite(n) ? n : null;
}

function parseIngredientLine(line: string): ExtractedIngredient | null {
  const cleaned = normalizeWhitespace(stripHtmlTags(line));
  if (!cleaned) return null;

  // Units (NL + US)
  const unitWords = [
    // metric NL
    "g", "gram", "kg", "ml", "l", "liter",
    "el", "eetlepel", "eetlepels",
    "tl", "theelepel", "theelepels",
    "stuk", "stuks", "stukje", "stukjes",
    "teentje", "teentjes",
    "snufje", "snufjes",
    "handje", "handjes",
    "bosje", "bosjes",
    "blikje", "blikjes", "blik",
    "pot", "potje",
    "plak", "plakken", "plakjes",
    // US
    "cup", "cups",
    "tbsp", "tbsps", "tablespoon", "tablespoons",
    "tsp", "tsps", "teaspoon", "teaspoons",
    "oz", "ounce", "ounces",
    "lb", "lbs",
    "pint", "pints",
    "quart", "quarts",
    "gallon", "gallons",
  ];

  const unitRe = unitWords.map(escapeRegExp).join("|");

  const re = new RegExp(
    `^\\s*(${QTY_RE_SOURCE})?\\s*((?:${unitRe})(?![a-zA-Z]))?\\s*[-–:]?\\s*(.+?)\\s*$`,
    "i",
  );

  const m = cleaned.match(re);
  if (!m) {
    return { name: cleaned, quantity: null, unit: null };
  }

  const qtyRaw = m[1] ?? "";
  const unitRaw = m[2] ?? "";
  const nameRaw = (m[3] ?? "").trim();

  if (!nameRaw) return null;

  let quantity: number | null = null;
  if (qtyRaw) {
    // handle patterns like "2 1/2"
    const parts = qtyRaw.trim().split(/\s+/);
    if (parts.length === 2 && parts[1].includes("/")) {
      const whole = parseNumberMaybe(parts[0]);
      const frac = parseNumberMaybe(parts[1]);
      if (whole !== null && frac !== null) quantity = whole + frac;
    } else {
      quantity = parseNumberMaybe(qtyRaw);
    }
  }

  const unitNorm = unitRaw ? METRIC_UNITS[unitRaw.toLowerCase()] ?? unitRaw.toLowerCase() : null;

  const converted = convertIngredientQuantity(quantity, unitNorm);

  return {
    name: nameRaw,
    quantity: converted.quantity,
    unit: converted.unit,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function convertIngredientQuantity(quantity: number | null, unit: string | null): { quantity: number | null; unit: string | null } {
  if (quantity === null || unit === null) return { quantity, unit };

  const u = unit.toLowerCase();

  // Conversions requested:
  // 1 cup = 240 ml, 1 tbsp = 1 el, 1 tsp = 1 tl,
  // 1 oz = 28 g, 1 lb = 454 g, 1 pint = 470 ml, 1 quart = 950 ml, 1 gallon = 3785 ml.
  let newQuantity = quantity;
  let newUnit = unit;

  // volume -> metric
  if (["cup", "cups"].includes(u)) {
    newQuantity = quantity * 240;
    newUnit = "ml";
  } else if (["tbsp", "tablespoon", "tablespoons"].includes(u)) {
    newQuantity = quantity; // 1 tbsp = 1 el (labels) as requested
    newUnit = "el";
  } else if (["tsp", "teaspoon", "teaspoons"].includes(u)) {
    newQuantity = quantity;
    newUnit = "tl";
  } else if (["oz", "ounce", "ounces"].includes(u)) {
    newQuantity = quantity * 28;
    newUnit = "g";
  } else if (["lb", "lbs"].includes(u)) {
    newQuantity = quantity * 454;
    newUnit = "g";
  } else if (["pint", "pints"].includes(u)) {
    newQuantity = quantity * 470;
    newUnit = "ml";
  } else if (["quart", "quarts"].includes(u)) {
    newQuantity = quantity * 950;
    newUnit = "ml";
  } else if (["gallon", "gallons"].includes(u)) {
    newQuantity = quantity * 3785;
    newUnit = "ml";
  } else {
    // already metric or NL units; map known label variants
    newUnit = METRIC_UNITS[u] ?? unit;
  }

  // Round and apply ml/g thresholds.
  if (newUnit === "ml") {
    const ml = newQuantity;
    if (ml >= 1000) {
      return { quantity: round1(ml / 1000), unit: "l" };
    }
    return { quantity: round1(ml), unit: "ml" };
  }

  if (newUnit === "g") {
    const g = newQuantity;
    if (g >= 1000) {
      return { quantity: round1(g / 1000), unit: "kg" };
    }
    return { quantity: round1(g), unit: "g" };
  }

  // kg stays kg, l stays l, el/tl, stuk etc: no threshold conversion.
  return { quantity: round1(newQuantity), unit: newUnit };
}

// Strips markdown bold markers and common decorative emoji social captions
// use as inline separators/bullets, which otherwise stick to the item text.
function stripDecorations(text: string): string {
  return normalizeWhitespace(text.replace(/\*\*/g, "").replace(/[✅⭐☑️✔️👉📌]/gu, ""));
}

function splitBulletItems(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/•/g, "\n")
    .replace(/\t/g, " ");

  let lines = normalized
    .split(/\n+/)
    .map((l) => normalizeWhitespace(l))
    .filter(Boolean);

  // Social captions frequently flatten their line breaks into spaces and
  // use " - " as a bullet separator instead — if we only found one blob,
  // split on that so each item/step still ends up on its own line.
  if (lines.length === 1) {
    const stripped = lines[0].replace(/^[-–—]\s*/, "");
    if (/\s[-–—]\s/.test(stripped)) {
      lines = stripped
        .split(/\s[-–—]\s+/)
        .map((l) => normalizeWhitespace(l))
        .filter(Boolean);
    }
  }

  // Strip a leading bullet marker on every line, real newlines or not, so
  // items/steps read cleanly instead of keeping a redundant "- " prefix.
  return lines
    .map((l) => l.replace(/^[-–—•]\s*/, ""))
    .map(stripDecorations)
    // Drop trailing hashtag-spam lines TikTok/Instagram captions commonly
    // end with (e.g. "##baking #recipe#dinner") — not part of the recipe.
    .filter((l) => !/^(#\S+\s*)+$/.test(l))
    .filter(Boolean);
}

function parseIngredientsFromText(ingredientsText: string | null | undefined): ExtractedIngredient[] {
  if (!ingredientsText) return [];
  const lines = splitBulletItems(ingredientsText);

  const out: ExtractedIngredient[] = [];
  for (const line of lines) {
    // if line is "- 2 tbsp sugar" or "• 2 tbsp sugar"
    const candidate = line.replace(/^[-–—•]\s*/g, "");
    const parsed = parseIngredientLine(candidate);
    if (parsed) out.push(parsed);
  }
  return out;
}

// -------------------- Fahrenheit to Celsius -------------------------------

function convertFahrenheitToCelsius(text: string): string {
  // Replace e.g. 350°F or 400 F
  return text.replace(/(\d+(?:[\.,]\d+)?)\s*°?\s*F\b/gi, (match) => {
    const m = match.match(/(\d+(?:[\.,]\d+)?)/);
    if (!m) return match;
    const f = Number(m[1].replace(",", "."));
    if (!isFinite(f)) return match;
    const c = (f - 32) * 5 / 9;
    const cRounded = Math.round(c * 10) / 10;
    // Keep original Fahrenheit? We'll output Celsius only.
    return `${cRounded}°C`;
  });
}

// -------------------- Main extraction ------------------------------------

function recipeFromJsonLd(node: any): ExtractResult {
  const title = typeof node.name === "string" ? normalizeWhitespace(stripHtmlTags(node.name)) : "";
  const imageUrl = firstImageUrl(node.image);
  const servings = parseServings(node.recipeYield ?? node.yield);
  const instructions = flattenInstructions(node.recipeInstructions);
  const ingredientsRaw = node.recipeIngredient ?? node.ingredients;
  const ingredientsText = Array.isArray(ingredientsRaw) ? ingredientsRaw.map((x: any) => (typeof x === "string" ? x : "")).filter(Boolean).join("\n") : null;
  const ingredients = parseIngredientsFromText(ingredientsText);

  return {
    title,
    imageUrl,
    servings,
    instructions: convertFahrenheitToCelsius(instructions),
    ingredients,
    sourceType: "website",
    rawCaption: null,
  };
}

async function extractRecipe(url: string): Promise<ExtractResult> {
  const host = hostOf(url);
  const result = emptyResult();

  // 1) YouTube
  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    result.sourceType = "video";
    const oembed = await fetchOembed("https://www.youtube.com/oembed", url);
    if (oembed) {
      result.title = oembed.title ?? "";
      result.imageUrl = oembed.thumbnail;
    }
    return result;
  }

  // 2) TikTok
  if (host.includes("tiktok.com")) {
    result.sourceType = "video";

    const [oembed, html] = await Promise.all([
      fetchOembed("https://www.tiktok.com/oembed", url),
      fetchHtml(url),
    ]);

    if (oembed?.thumbnail) result.imageUrl = oembed.thumbnail;

    const og = html ? extractOpenGraph(html) : null;
    if (og?.image && !result.imageUrl) result.imageUrl = og.image;

    // TikTok's oEmbed "title" is actually the full caption (TikTok has no
    // separate title field), same content og:description would carry — so
    // treat whichever is available as the caption source and always run it
    // through the same split/cap pipeline. Scraping the page for
    // og:description often gets blocked (TikTok's bot protection), and
    // previously that silently left the raw, unsplit oEmbed caption in the
    // title field whenever that happened.
    const rawCaption = og?.description || oembed?.title || "";
    if (rawCaption) {
      result.rawCaption = rawCaption;
      const caption = normalizeCaption(rawCaption);
      const split = splitTitleIngredientsInstructionsFromCaption(caption);
      result.title = split.title;
      if (split.servings) result.servings = split.servings;
      if (split.ingredientsText) {
        result.ingredients = parseIngredientsFromText(split.ingredientsText);
      }
      result.instructions = convertFahrenheitToCelsius(split.instructionsText ?? "");
    }

    return result;
  }

  // 3) Instagram
  if (host.includes("instagram.com")) {
    result.sourceType = "video";
    const html = await fetchHtml(url);
    if (!html) return result;

    const og = extractOpenGraph(html);
    if (og.title) result.title = og.title;
    if (og.image) result.imageUrl = og.image;

    if (og.description) {
      result.rawCaption = og.description;
      const caption = normalizeCaption(og.description);
      const split = splitTitleIngredientsInstructionsFromCaption(caption);
      result.title = split.title || result.title;
      if (split.servings) result.servings = split.servings;
      if (split.ingredientsText) {
        result.ingredients = parseIngredientsFromText(split.ingredientsText);
      }
      result.instructions = convertFahrenheitToCelsius(split.instructionsText ?? "");
    }

    return result;
  }

  // 4) Recipe websites
  const html = await fetchHtml(url);
  if (!html) return result;

  const jsonLd = extractJsonLdRecipe(html);
  if (jsonLd) {
    return recipeFromJsonLd(jsonLd.node);
  }

  // fallback Open Graph
  const og = extractOpenGraph(html);
  result.sourceType = "website";
  result.title = og.title ?? "";
  result.imageUrl = og.image;
  if (og.description) {
    const caption = normalizeCaption(og.description);
    // For plain websites, we treat og:description as instructions/caption
    result.rawCaption = og.description;
    result.instructions = convertFahrenheitToCelsius(caption);
    // Also try splitting headings to get ingredients/instructions.
    const split = splitTitleIngredientsInstructionsFromCaption(caption);
    // A real page <title>/og:title is a proper title — only fall back to a
    // caption snippet when the site didn't provide one.
    result.title = result.title || split.title;
    if (split.servings) result.servings = split.servings;
    if (split.ingredientsText) result.ingredients = parseIngredientsFromText(split.ingredientsText);
    if (split.instructionsText) result.instructions = convertFahrenheitToCelsius(split.instructionsText);
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'url' in request body" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const result = await extractRecipe(url);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
