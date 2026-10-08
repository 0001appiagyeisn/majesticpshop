import type { Product } from "@/types";

/**
 * Normalizes English words by removing plurals or standardizing endings
 */
export function stemWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length <= 2) return w;

  // Specific irregulars & common apparel words
  if (w === "hoodies") return "hoodie";
  if (w === "scarves") return "scarf";
  if (w === "woggles") return "woggle";
  if (w === "slides") return "slide";
  if (w === "patches") return "patch";
  if (w === "glasses") return "glass";
  if (w === "tshirts" || w === "t-shirts") return "t-shirt";

  // General English suffix reductions
  if (w.endsWith("ies") && w.length > 4) {
    return w.slice(0, -3) + "y"; // accessories -> accessory
  }
  if (w.endsWith("es") && (w.endsWith("shes") || w.endsWith("ches") || w.endsWith("sses") || w.endsWith("xes"))) {
    return w.slice(0, -2); // patches -> patch
  }
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) {
    return w.slice(0, -1); // shirts -> shirt, tags -> tag, caps -> cap
  }

  return w;
}

// Synonyms & related terminology for broad Pathfinder shop searches
const SYNONYMS: Record<string, string[]> = {
  shirt: ["shirts", "tshirt", "tshirts", "t-shirt", "t-shirts", "tee", "tees", "top", "collar"],
  tshirt: ["shirt", "shirts", "t-shirt", "t-shirts", "tee", "tees", "top"],
  hoodie: ["hoodies", "sweater", "sweaters", "pullover", "pullovers", "jacket", "jackets", "sweatshirt"],
  tag: ["tags", "patch", "patches", "badge", "badges", "sleeve", "shoulder", "sewon", "sew-on", "sew", "label"],
  patch: ["tag", "tags", "badge", "badges", "sewon", "sew-on", "shoulder", "sleeve"],
  pin: ["pins", "badge", "badges", "lapel", "enamel", "brooch"],
  cap: ["caps", "hat", "hats", "beret", "berets", "headwear"],
  beret: ["cap", "caps", "hat", "hats"],
  crest: ["crests", "emblem", "logo", "insignia", "patch"],
  neckerchief: ["neckerchiefs", "scarf", "scarves", "tie", "slide", "woggle"],
  slide: ["slides", "woggle", "woggles", "neckerchief"],
  woggle: ["woggles", "slide", "slides", "neckerchief"],
  bottle: ["bottles", "flask", "flasks", "water", "cup", "drink"],
  water: ["bottle", "bottles", "flask", "drinkware"],
  capricorn: ["goat", "ram", "horns", "sea-goat"],
  goat: ["capricorn", "ram", "horns"],
  tiger: ["tigers", "feline", "cat", "stripes"],
  chrysanthemum: ["flower", "flowers", "floral", "blossom"],
  flower: ["chrysanthemum", "floral"],
  peacock: ["peachick", "bird", "crest", "regalia"],
  peachick: ["peacock", "bird"],
  uniform: ["regalia", "attire", "apparel", "clothing", "dress"]
};

/**
 * Intelligent, broad search matching for shop products.
 * Handles:
 * - Singular/plural variations (e.g. "shirts" -> matches "T-Shirt")
 * - Multi-word / tokenized queries (e.g. "capricorn shirt" matches "Unit T-Shirt - Capricorn")
 * - Category names & descriptions
 * - Common Pathfinder regalia synonyms & mascot aliases
 * - Word-boundary awareness to avoid false substring collisions
 */
export function matchProductSearch(
  product: Product,
  query: string,
  categoryName?: string
): boolean {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return true;

  // Split query into individual search tokens
  const tokens = cleanQuery.split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return true;

  // Extract raw text fields from product
  const pName = (product.name || "").toLowerCase();
  const pUnit = (product.unit || "").toLowerCase();
  const pDesc = (product.description || "").toLowerCase();
  const pCat = (categoryName || "").toLowerCase();

  const combinedRaw = `${pName} ${pUnit} ${pCat} ${pDesc}`;

  // Split product content into word tokens
  const productWords = combinedRaw
    .replace(/[^\w\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(w => w.length > 0);

  const wordSet = new Set<string>();
  const stemmedWordSet = new Set<string>();

  productWords.forEach(w => {
    wordSet.add(w);
    stemmedWordSet.add(stemWord(w));
  });

  // Also support glued versions (e.g., "tshirt" for "t-shirt")
  const pNameNoSpace = pName.replace(/[\s-_]+/g, "");
  wordSet.add(pNameNoSpace);

  // Expand relevant synonyms for all detected words in this product
  const relevantSynonyms = new Set<string>();
  for (const word of wordSet) {
    const list = SYNONYMS[word] || SYNONYMS[stemWord(word)];
    if (list) {
      list.forEach(s => {
        relevantSynonyms.add(s.toLowerCase());
        relevantSynonyms.add(stemWord(s.toLowerCase()));
      });
    }
  }

  // Every token in the user's query must find a match
  return tokens.every((rawToken) => {
    const token = rawToken.toLowerCase();
    const stemmedToken = stemWord(token);
    const tokenNoPunct = token.replace(/[\s-_]+/g, "");

    // 1. Direct word or stem match in product
    if (
      wordSet.has(token) ||
      wordSet.has(stemmedToken) ||
      wordSet.has(tokenNoPunct) ||
      stemmedWordSet.has(token) ||
      stemmedWordSet.has(stemmedToken)
    ) {
      return true;
    }

    // 2. Prefix / partial match for queries with at least 3 characters
    if (token.length >= 3) {
      for (const w of wordSet) {
        if (w.startsWith(token) || w.startsWith(stemmedToken)) {
          return true;
        }
      }
    }

    // 3. Synonym match from product's expanded synonyms
    if (
      relevantSynonyms.has(token) ||
      relevantSynonyms.has(stemmedToken) ||
      relevantSynonyms.has(tokenNoPunct)
    ) {
      return true;
    }

    // 4. Token's own synonym dictionary
    const tokenSyns = SYNONYMS[token] || SYNONYMS[stemmedToken];
    if (tokenSyns) {
      for (const syn of tokenSyns) {
        const synClean = syn.toLowerCase();
        const synStem = stemWord(synClean);
        if (
          wordSet.has(synClean) ||
          wordSet.has(synStem) ||
          stemmedWordSet.has(synClean) ||
          stemmedWordSet.has(synStem)
        ) {
          return true;
        }
      }
    }

    return false;
  });
}
