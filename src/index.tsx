#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import App from './app.js';
import { HNCache } from './cache/db.js';
import type { Feed } from './types.js';
import { FEEDS } from './types.js';

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function getFeedArg(): Feed {
  const feedArg = getArg('--feed') ?? args.find(a => !a.startsWith('-') && FEEDS.includes(a as Feed));
  return (FEEDS.includes(feedArg as Feed) ? feedArg : 'top') as Feed;
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
hackernews — Terminal Hacker News reader

Usage:
  hackernews [feed] [options]

Feeds:
  top     Front page stories (default)
  new     New stories
  best    Best stories
  ask     Ask HN
  show    Show HN
  jobs    Jobs

Options:
  --feed <feed>     Set initial feed
  --search <query>  Start with search results
  -h, --help        Show this help

Keyboard shortcuts:
  j/k         Move up/down
  Tab         Switch panes (stories ↔ preview)
  [/]         Previous/next feed
  1-6         Jump to feed by number
  n/p         Next/prev page
  /           Search
  Enter       Open comments
  Space       Collapse/expand comment (in comments mode)
  o           Open article in browser
  O           Open HN discussion page in browser
  Esc         Cancel / go back
  r           Refresh
  q           Quit
`.trim());
  process.exit(0);
}

const cache = new HNCache();
const initialFeed = getFeedArg();
const initialSearch = getArg('--search');

const { unmount } = render(
  <App cache={cache} initialFeed={initialFeed} initialSearch={initialSearch} />,
  { exitOnCtrlC: false }
);

process.on('exit', () => {
  try { cache.close(); } catch {}
});
