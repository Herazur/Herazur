#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CLEAN_CONTENT_REGEX = {
  comments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
  templateLiterals: /`[\s\S]*?`/g,
  strings: /'[^']*'|"[^"]*"/g,
  jsxExpressions: /\{.*?\}/g,
  htmlEntities: {
    quot: /&quot;/g,
    amp: /&amp;/g,
    lt: /&lt;/g,
    gt: /&gt;/g,
    apos: /&apos;/g
  }
};

const EXTRACTION_REGEX = {
  route: /<Route\s+[^>]*>/g,
  path: /path=["']([^"']+)["']/,
  element: /element=\{<(\w+)[^}]*\/?\s*>\}/,
  seo: /<Seo[\s\S]*?\/>/i,
  seoTest: /<Seo[\s\S]*?\/>/i,
  seoTitle: /title=(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/i,
  seoDescription: /description=(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\})/i,
  helmet: /<Helmet[^>]*?>([\s\S]*?)<\/Helmet>/i,
  helmetTest: /<Helmet[\s\S]*?<\/Helmet>/i,
  title: /<title[^>]*?>\s*(.*?)\s*<\/title>/i,
  description: /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
};

function cleanContent(content) {
  return content
    .replace(CLEAN_CONTENT_REGEX.comments, '')
    .replace(CLEAN_CONTENT_REGEX.templateLiterals, '""')
    .replace(CLEAN_CONTENT_REGEX.strings, '""');
}

function cleanText(text) {
  if (!text) return text;
  
  return text
    .replace(CLEAN_CONTENT_REGEX.jsxExpressions, '')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.quot, '"')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.amp, '&')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.lt, '<')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.gt, '>')
    .replace(CLEAN_CONTENT_REGEX.htmlEntities.apos, "'")
    .trim();
}

function extractRoutes(appJsxPath) {
  if (!fs.existsSync(appJsxPath)) return new Map();

  try {
    const content = fs.readFileSync(appJsxPath, 'utf8');
    const routes = new Map();

    const routeMatches = content.matchAll(
      /<Route\s+path=["']([^"']+)["']\s+element=\{<(\w+)\s*\/>\}\s*\/>/g
    );

    for (const match of routeMatches) {
      const routePath = match[1].startsWith('/') ? match[1] : `/${match[1]}`;
      const componentName = match[2];
      if (!routes.has(componentName)) {
        routes.set(componentName, routePath);
      }
    }

    return routes;
  } catch (error) {
    return new Map();
  }
}

function findReactFiles(dir) {
  return fs.readdirSync(dir).map(item => path.join(dir, item));
}

function pickMatch(match) {
  if (!match) return null;
  return match[1] || match[2] || match[3] || null;
}

function extractMetaData(content, filePath, routes) {
  const cleanedContent = cleanContent(content);
  
  const hasSeo = EXTRACTION_REGEX.seoTest.test(cleanedContent);
  const hasHelmet = EXTRACTION_REGEX.helmetTest.test(cleanedContent);

  if (!hasSeo && !hasHelmet) {
    return null;
  }

  let title;
  let description;

  if (hasSeo) {
    const seoMatch = content.match(EXTRACTION_REGEX.seo);
    const seoTag = seoMatch?.[0] || '';
    const titleMatch = seoTag.match(EXTRACTION_REGEX.seoTitle);
    const descMatch = seoTag.match(EXTRACTION_REGEX.seoDescription);

    title = cleanText(pickMatch(titleMatch));
    description = cleanText(pickMatch(descMatch));
  }

  if (hasHelmet && (!title || !description)) {
    const helmetMatch = content.match(EXTRACTION_REGEX.helmet);
    const helmetContent = helmetMatch?.[1] || '';
    const titleMatch = helmetContent.match(EXTRACTION_REGEX.title);
    const descMatch = helmetContent.match(EXTRACTION_REGEX.description);

    if (!title) title = cleanText(titleMatch?.[1]);
    if (!description) description = cleanText(descMatch?.[1]);
  }
  
  const fileName = path.basename(filePath, path.extname(filePath));
  const url = routes.size && routes.has(fileName)
    ? routes.get(fileName) 
    : generateFallbackUrl(fileName);
  
  return {
    url,
    title: title || 'Untitled Page',
    description: description || 'No description available'
  };
}

function generateFallbackUrl(fileName) {
  const cleanName = fileName.replace(/Page$/, '').toLowerCase();
  return cleanName === 'app' ? '/' : `/${cleanName}`;
}

function generateLlmsTxt(pages) {
  const sortedPages = pages.sort((a, b) => a.title.localeCompare(b.title));
  const pageEntries = sortedPages.map(page => 
    `- [${page.title}](${page.url}): ${page.description}`
  ).join('\n');
  
  return `## Pages\n${pageEntries}`;
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function processPageFile(filePath, routes) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return extractMetaData(content, filePath, routes);
  } catch (error) {
    console.error(`ERROR: Error processing ${filePath}:`, error.message);
    return null;
  }
}

function main() {
  const pagesDir = path.join(process.cwd(), 'src', 'pages');
  const appJsxPath = path.join(process.cwd(), 'src', 'App.jsx');

  let pages = [];
  
  if (!fs.existsSync(pagesDir)) {
    pages.push(processPageFile(appJsxPath, []))
    pages = pages.filter(Boolean);
  } else {
    const routes = extractRoutes(appJsxPath);
    const reactFiles = findReactFiles(pagesDir);

    pages = reactFiles
      .map(filePath => processPageFile(filePath, routes))
      .filter(Boolean);
  }

  if (pages.length === 0) {
    console.error('ERROR: No pages with Seo or Helmet components found!');
    process.exit(1);
  }


  const llmsTxtContent = generateLlmsTxt(pages);
  const outputPath = path.join(process.cwd(), 'public', 'llms.txt');
  
  ensureDirectoryExists(path.dirname(outputPath));
  fs.writeFileSync(outputPath, llmsTxtContent, 'utf8');
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main();
}
