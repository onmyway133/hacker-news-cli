import { parse } from 'node-html-parser';

const REMOVE_TAGS = ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript', 'form', 'button', 'svg'];

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function extractText(html: string): string {
  const root = parse(html);

  // Remove noise elements
  for (const tag of REMOVE_TAGS) {
    root.querySelectorAll(tag).forEach(el => el.remove());
  }

  // Try to find main content container in order of preference
  const candidates = [
    root.querySelector('article'),
    root.querySelector('[role="main"]'),
    root.querySelector('main'),
    root.querySelector('.post-content'),
    root.querySelector('.article-body'),
    root.querySelector('.entry-content'),
    root.querySelector('#content'),
    root.querySelector('.content'),
  ].filter((el): el is NonNullable<typeof el> => el !== null);

  const container = candidates[0] ?? root.querySelector('body') ?? root;

  // Convert <p>, <br>, <h1>-<h6>, <li> to newlines, then extract text
  let text = container.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '');  // strip remaining tags

  text = decodeEntities(text);

  // Normalize whitespace: collapse multiple blank lines, trim lines
  text = text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

export async function extractArticle(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('html')) throw new Error('Not an HTML page');

  const html = await res.text();
  const text = extractText(html);

  if (text.length < 100) throw new Error('Insufficient content extracted');

  return text;
}

if (import.meta.main) {
  const url = process.argv[2] ?? 'https://www.paulgraham.com/greatwork.html';
  try {
    const text = await extractArticle(url);
    console.log(text.slice(0, 500));
  } catch (e) {
    console.error('Failed:', e);
  }
}
