/**
 * Server-only: the latest blog posts, read from the Hashnode blog's RSS feed (the main blog)
 * when the page is built and again about once a day. Posts that are also on dev.to get that
 * link too, matched by the dev.to copy's canonical URL. Cover images may only come from the
 * hosts in COVER_HOSTS (lib/blog-hosts.ts, also next/image's list in next.config.ts).
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PROFILE } from '@/data/profile';
import { COVER_HOSTS } from './blog-hosts';

export interface BlogPost {
  title: string;
  /** The post on Hashnode. */
  url: string;
  /** The same post on dev.to, when it was cross-posted there. */
  devtoUrl?: string;
  /** The post's own cover image (Hashnode's, else dev.to's). */
  cover?: string;
  /** ISO date. */
  published: string;
  /** "Nov 9, 2026" */
  dateLabel: string;
  summary: string;
  readMinutes: number;
}

/** How often the page looks for new posts, in seconds (Next.js ISR). */
export const BLOG_REVALIDATE = 24 * 60 * 60;
/** Posts shown in the Writing section (the Terminal lists the same ones). */
const MAX_POSTS = 6;
const WORDS_PER_MINUTE = 225;

export const BLOG_URL = PROFILE.links.hashnode.href;
const FEED_URL = `${BLOG_URL}/rss.xml`;
const DEVTO_USER = new URL(PROFILE.links.devto.href).pathname.replaceAll('/', '');
const DEVTO_API = `https://dev.to/api/articles?username=${DEVTO_USER}&per_page=100`;

/**
 * Browser tests set BLOG_FIXTURES=1 to read tests/fixtures/blog instead, so the test build never
 * depends on the live blogs. (A fixed folder: a path from an env var made Next.js trace the
 * whole project into the server bundle.)
 */
async function load(url: string, fixture: string): Promise<string> {
  if (process.env.BLOG_FIXTURES === '1') {
    return readFile(path.join(/* turbopackIgnore: true */ process.cwd(), 'tests', 'fixtures', 'blog', fixture), 'utf8');
  }
  const res = await fetch(url, { next: { revalidate: BLOG_REVALIDATE } });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.text();
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  let posts: BlogPost[];
  try {
    posts = parseFeed(await load(FEED_URL, 'hashnode-rss.xml')).slice(0, MAX_POSTS);
  } catch (error) {
    // While building, show the "read them on the blog" fallback rather than failing the deploy.
    // Later (a daily refresh) throwing keeps the last good page instead of replacing it.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('Blog posts not loaded:', error);
      return [];
    }
    throw error;
  }
  const devto = await loadDevto();
  return posts.map((post) => {
    const copy = devto.get(sameUrl(post.url));
    return { ...post, devtoUrl: copy?.url, cover: post.cover ?? copy?.cover };
  });
}

interface DevtoCopy {
  url: string;
  cover?: string;
}

/** dev.to copies by their canonical (Hashnode) URL. A failure here only drops the dev.to links. */
async function loadDevto(): Promise<Map<string, DevtoCopy>> {
  try {
    const articles = JSON.parse(await load(DEVTO_API, 'devto.json')) as Record<string, unknown>[];
    const copies = new Map<string, DevtoCopy>();
    for (const a of articles) {
      if (typeof a.url === 'string' && typeof a.canonical_url === 'string') {
        copies.set(sameUrl(a.canonical_url), { url: a.url, cover: coverUrl(a.cover_image) });
      }
    }
    return copies;
  } catch (error) {
    console.warn('dev.to links not loaded:', error);
    return new Map();
  }
}

const sameUrl = (url: string) => url.replace(/\/+$/, '').toLowerCase();

/** An https image on one of COVER_HOSTS, else undefined. */
function coverUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && COVER_HOSTS.includes(url.hostname) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Reads the items of an RSS 2.0 feed, newest first. */
export function parseFeed(xml: string): BlogPost[] {
  const posts: BlogPost[] = [];
  for (const [, item = ''] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = withoutEmoji(tag(item, 'title'));
    const url = tag(item, 'link');
    const published = new Date(tag(item, 'pubDate'));
    if (!title || !/^https:\/\//.test(url) || Number.isNaN(published.getTime())) continue;
    const words = stripHtml(tag(item, 'content:encoded')).split(/\s+/).filter(Boolean).length;
    posts.push({
      title,
      url,
      published: published.toISOString(),
      dateLabel: published.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
      summary: tag(item, 'description'),
      cover: coverUrl(/<enclosure\s[^>]*url="([^"]+)"/.exec(item)?.[1]?.replaceAll('&amp;', '&')),
      readMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    });
  }
  return posts.sort((a, b) => b.published.localeCompare(a.published));
}

/** The site draws its own emoji and shows no device emoji, so they come out of post titles. */
function withoutEmoji(text: string): string {
  return text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
}

/** A tag's text, with CDATA unwrapped and entities decoded. */
function tag(xml: string, name: string): string {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
  if (!match?.[1]) return '';
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(match[1]);
  return (cdata ? cdata[1]! : decodeEntities(match[1])).trim();
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' '));
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (whole, code: string) => {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (code[0] !== '#') return named[code.toLowerCase()] ?? whole;
    const n = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
  });
}
