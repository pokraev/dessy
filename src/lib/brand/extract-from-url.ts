import { getOpenAIApiKey, type AIProvider } from '@/lib/storage/apiKeyStorage';
import type { ColorSwatch, TypographyPreset, SavedBrand } from '@/types/brand';

const PROMPT_PREFIX = `You are a brand identity expert. Analyze the website at the given URL and extract its complete brand identity.

If you know this website, use your knowledge. If not, infer from the HTML provided.

Return ONLY valid JSON:
{
  "name": "Brand Name",
  "colors": [
    { "hex": "#hex1", "name": "Primary" },
    { "hex": "#hex2", "name": "Secondary" },
    { "hex": "#hex3", "name": "Accent" },
    { "hex": "#hex4", "name": "Background" },
    { "hex": "#hex5", "name": "Text" }
  ],
  "typography": [
    { "name": "Headline", "fontFamily": "Font Name", "fontSize": 32, "fontWeight": 700, "lineHeight": 1.2, "letterSpacing": 0, "color": "#1a1a1a" },
    { "name": "Subhead", "fontFamily": "Font Name", "fontSize": 22, "fontWeight": 600, "lineHeight": 1.3, "letterSpacing": 0, "color": "#333333" },
    { "name": "Body", "fontFamily": "Font Name", "fontSize": 16, "fontWeight": 400, "lineHeight": 1.5, "letterSpacing": 0, "color": "#333333" },
    { "name": "Caption", "fontFamily": "Font Name", "fontSize": 12, "fontWeight": 400, "lineHeight": 1.4, "letterSpacing": 0, "color": "#666666" },
    { "name": "CTA", "fontFamily": "Font Name", "fontSize": 16, "fontWeight": 700, "lineHeight": 1.2, "letterSpacing": 20, "color": "#ffffff" }
  ],
  "style": "minimal"
}

Valid style values: "minimal", "bold", "corporate", "playful", "elegant"

Rules:
- Extract 3-6 dominant brand colors with descriptive names (Primary, Secondary, Accent, etc.)
- TYPOGRAPHY IS CRITICAL: Look at the HTML for Google Fonts links (fonts.googleapis.com), @font-face declarations, font-family CSS properties, and CSS custom properties. Use the EXACT font family names from the website, not generic ones.
- If the HTML contains a Google Fonts link like "family=Roboto:wght@400;700", use "Roboto" as the font family
- If the HTML contains font-family CSS like "font-family: 'Playfair Display'", use "Playfair Display"
- Create 5 typography presets with accurate font families, sizes, and weights matching the website
- Font sizes in px, letter spacing in hundredths of em (0 = normal, 50 = 0.05em)
- Choose the closest visual style
- Return ONLY JSON`;

interface ExtractedBrandData {
  name?: string;
  colors?: Array<{ hex: string; name?: string }>;
  typography?: Array<{
    name: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    color: string;
  }>;
  style?: string;
}

export async function extractBrandFromUrl(
  url: string,
  apiKey: string,
  provider: AIProvider
): Promise<SavedBrand> {
  // Try fetching HTML via CORS proxy — extract font/style-relevant parts
  let htmlContext = '';
  try {
    // Try multiple proxies in case one is rate-limited
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    ];
    let fullHtml = '';
    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          fullHtml = await res.text();
          break;
        }
      } catch { /* try next proxy */ }
    }
    if (fullHtml) {
      // Extract <head> (contains font links, meta, style tags)
      const headMatch = fullHtml.match(/<head[\s\S]*?<\/head>/i);
      const head = headMatch ? headMatch[0] : '';
      // Extract inline <style> blocks
      const styles = [...fullHtml.matchAll(/<style[\s\S]*?<\/style>/gi)].map(m => m[0]).join('\n');
      // Extract Google Fonts links
      const fontLinks = [...fullHtml.matchAll(/<link[^>]*fonts\.googleapis[^>]*>/gi)].map(m => m[0]).join('\n');
      // Extract CSS custom properties and font declarations
      const cssVars = [...fullHtml.matchAll(/--[a-z-]+\s*:\s*[^;]+/gi)].slice(0, 30).map(m => m[0]).join(';\n');
      // First 2000 chars of body for structure hints
      const bodyMatch = fullHtml.match(/<body[\s\S]*?<\/body>/i);
      const bodyStart = bodyMatch ? bodyMatch[0].slice(0, 2000) : '';

      htmlContext = [
        fontLinks && `Font links:\n${fontLinks}`,
        head.length > 0 && `Head (truncated):\n${head.slice(0, 2000)}`,
        styles.length > 0 && `Inline styles:\n${styles.slice(0, 2000)}`,
        cssVars && `CSS variables:\n${cssVars}`,
        bodyStart && `Body start:\n${bodyStart}`,
      ].filter(Boolean).join('\n\n');
    }
  } catch { /* AI will use its knowledge */ }

  const userPrompt = htmlContext
    ? `Website URL: ${url}\n\nHere are the font links, styles, and CSS from the page:\n\n${htmlContext}\n\nExtract the complete brand identity. Pay special attention to the font-family declarations, Google Fonts links, and CSS custom properties for colors and typography.`
    : `Website URL: ${url}\n\nExtract the complete brand identity based on your knowledge of this website.`;

  let raw: ExtractedBrandData;
  try {
    if (provider === 'claude') {
      raw = await callClaude(apiKey, userPrompt);
    } else if (provider === 'openai') {
      raw = await callOpenAI(apiKey, userPrompt);
    } else {
      raw = await callGemini(apiKey, userPrompt);
    }
  } catch {
    // Fallback: try OpenAI if available and wasn't the primary
    const openaiKey = getOpenAIApiKey();
    if (provider !== 'openai' && openaiKey) {
      try {
        raw = await callOpenAI(openaiKey, userPrompt);
      } catch {
        raw = {};
      }
    } else {
      raw = {};
    }
  }

  if (!raw.colors?.length && !raw.typography?.length) {
    throw new Error('Could not extract brand identity. Try a different provider or check the URL.');
  }

  // Convert to SavedBrand
  const now = new Date().toISOString();
  const colors: ColorSwatch[] = (raw.colors ?? []).map((c) => ({
    id: crypto.randomUUID(),
    hex: c.hex,
    name: c.name ?? '',
  }));

  const typographyPresets: TypographyPreset[] = (raw.typography ?? []).map((t) => ({
    id: `preset-${t.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: t.name,
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
    color: t.color,
  }));

  return {
    id: crypto.randomUUID(),
    name: raw.name ?? new URL(url).hostname.replace('www.', ''),
    sourceUrl: url,
    colors,
    typographyPresets,
    style: raw.style,
    createdAt: now,
    updatedAt: now,
  };
}

function safeParseJSON(text: string): ExtractedBrandData {
  // Strip markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  const cleaned = fenceMatch ? fenceMatch[1] : text;
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract valid JSON from a truncated response
    const jsonMatch = cleaned.match(/\{[\s\S]*}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
    }
    return {};
  }
}

async function callGemini(apiKey: string, userPrompt: string): Promise<ExtractedBrandData> {
  // Use gemini-2.5-flash for reliable JSON output
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: PROMPT_PREFIX }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096 },
      }),
    }
  );
  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${rawText.slice(0, 200)}`);
  }
  // Extract the text field from the Gemini response using regex
  // to avoid JSON.parse on the potentially malformed envelope
  const textMatch = rawText.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (textMatch) {
    const innerJson = textMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    return safeParseJSON(innerJson);
  }
  return {};
}

async function callClaude(apiKey: string, userPrompt: string): Promise<ExtractedBrandData> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: PROMPT_PREFIX,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText.slice(0, 200)}`);
  }
  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error('Failed to parse Claude API response');
  }
  const text = (data.content as Array<{ type: string; text?: string }> | undefined)?.find((b) => b.type === 'text')?.text ?? '{}';
  return safeParseJSON(text);
}

async function callOpenAI(apiKey: string, userPrompt: string): Promise<ExtractedBrandData> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT_PREFIX },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText.slice(0, 200)}`);
  }
  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error('Failed to parse OpenAI API response');
  }
  const text = (data.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? '{}';
  return safeParseJSON(text);
}
