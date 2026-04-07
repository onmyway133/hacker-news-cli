import { Database } from 'bun:sqlite';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync } from 'fs';
import type { Feed, Story } from '../types.js';

const DB_DIR = join(homedir(), '.hackernews');
const DB_PATH = join(DB_DIR, 'cache.db');

const FEED_TTL: Record<Feed, number> = {
  top: 5 * 60,
  new: 5 * 60,
  best: 30 * 60,
  ask: 30 * 60,
  show: 30 * 60,
  jobs: 30 * 60,
};

const ARTICLE_TTL = 24 * 60 * 60;

export class HNCache {
  private db: Database;

  constructor() {
    mkdirSync(DB_DIR, { recursive: true });
    this.db = new Database(DB_PATH, { create: true });
    this.db.run('PRAGMA journal_mode=WAL');
    this.migrate();
  }

  private migrate() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS stories (
        feed TEXT NOT NULL,
        page INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL,
        total_pages INTEGER NOT NULL DEFAULT 1,
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (feed, page)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS read_items (
        id INTEGER PRIMARY KEY,
        read_at INTEGER NOT NULL
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS article_cache (
        url TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        fetched_at INTEGER NOT NULL
      )
    `);
  }

  getStories(feed: Feed, page: number): { stories: Story[]; totalPages: number } | null {
    const ttl = FEED_TTL[feed];
    const now = Math.floor(Date.now() / 1000);

    const row = this.db.query<{ data: string; total_pages: number; fetched_at: number }, [string, number]>(
      'SELECT data, total_pages, fetched_at FROM stories WHERE feed = ? AND page = ?'
    ).get(feed, page);

    if (!row) return null;
    if (now - row.fetched_at > ttl) return null;

    try {
      return { stories: JSON.parse(row.data) as Story[], totalPages: row.total_pages };
    } catch {
      return null;
    }
  }

  setStories(feed: Feed, page: number, stories: Story[], totalPages: number) {
    const now = Math.floor(Date.now() / 1000);
    this.db.run(
      'INSERT OR REPLACE INTO stories (feed, page, data, total_pages, fetched_at) VALUES (?, ?, ?, ?, ?)',
      [feed, page, JSON.stringify(stories), totalPages, now]
    );
  }

  markRead(id: number) {
    const now = Math.floor(Date.now() / 1000);
    this.db.run('INSERT OR REPLACE INTO read_items (id, read_at) VALUES (?, ?)', [id, now]);
  }

  getReadIds(): Set<number> {
    const rows = this.db.query<{ id: number }, []>('SELECT id FROM read_items').all();
    return new Set(rows.map(r => r.id));
  }

  getArticle(url: string): string | null {
    const now = Math.floor(Date.now() / 1000);
    const row = this.db.query<{ text: string; fetched_at: number }, [string]>(
      'SELECT text, fetched_at FROM article_cache WHERE url = ?'
    ).get(url);

    if (!row) return null;
    if (now - row.fetched_at > ARTICLE_TTL) return null;

    return row.text;
  }

  setArticle(url: string, text: string) {
    const now = Math.floor(Date.now() / 1000);
    this.db.run(
      'INSERT OR REPLACE INTO article_cache (url, text, fetched_at) VALUES (?, ?, ?)',
      [url, text, now]
    );
  }

  close() {
    this.db.close();
  }
}
