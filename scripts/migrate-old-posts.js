#!/usr/bin/env node

/**
 * Migration script to convert old blog posts to new format
 *
 * Old format (Ghost-like):
 * - title, description, full_description, slug, date_published, date_updated, tags
 *
 * New format (Astro):
 * - title, date, updated, slug, author, excerpt, category, keywords, archived
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLD_BLOG_PATH = '/Users/pmagaz/js/pablomagaz.com/blog/old';
const NEW_BLOG_PATH = path.join(__dirname, '../content/blog');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const [, frontmatterStr, body] = match;
  const frontmatter = {};

  frontmatterStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body };
}

function convertPost(oldContent, filename) {
  const parsed = parseFrontmatter(oldContent);
  if (!parsed) {
    console.error(`Failed to parse ${filename}`);
    return null;
  }

  const { frontmatter, body } = parsed;

  // Convert date format
  const date = frontmatter.date_published
    ? new Date(frontmatter.date_published).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const updated = frontmatter.date_updated
    ? new Date(frontmatter.date_updated).toISOString().split('T')[0]
    : undefined;

  // Extract tags/keywords
  const keywords = frontmatter.tags
    ? frontmatter.tags.split(',').map(t => t.trim())
    : [];

  // Build new frontmatter
  const newFrontmatter = {
    title: frontmatter.title,
    date: date,
    ...(updated && { updated: updated }),
    slug: frontmatter.slug,
    author: 'Pablo Magaz',
    excerpt: frontmatter.full_description || frontmatter.description || '',
    category: 'technology', // Default for old technical posts
    keywords: keywords,
    archived: true, // Mark as archived
  };

  // Build new content
  let newContent = '---\n';
  Object.entries(newFrontmatter).forEach(([key, value]) => {
    if (value === undefined) return;

    if (Array.isArray(value)) {
      newContent += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
    } else if (typeof value === 'boolean') {
      newContent += `${key}: ${value}\n`;
    } else {
      // Escape quotes in strings
      const escaped = String(value).replace(/"/g, '\\"');
      newContent += `${key}: "${escaped}"\n`;
    }
  });
  newContent += '---\n\n';
  newContent += body.trim() + '\n';

  return newContent;
}

function migrateAllPosts() {
  if (!fs.existsSync(OLD_BLOG_PATH)) {
    console.error(`Old blog path not found: ${OLD_BLOG_PATH}`);
    process.exit(1);
  }

  const files = fs.readdirSync(OLD_BLOG_PATH).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} posts to migrate`);

  let success = 0;
  let failed = 0;

  files.forEach(filename => {
    try {
      const oldPath = path.join(OLD_BLOG_PATH, filename);
      const oldContent = fs.readFileSync(oldPath, 'utf8');

      const newContent = convertPost(oldContent, filename);
      if (!newContent) {
        failed++;
        return;
      }

      const newPath = path.join(NEW_BLOG_PATH, filename);
      fs.writeFileSync(newPath, newContent, 'utf8');

      console.log(`✓ Migrated: ${filename}`);
      success++;
    } catch (error) {
      console.error(`✗ Failed to migrate ${filename}:`, error.message);
      failed++;
    }
  });

  console.log(`\nMigration complete:`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed}`);
}

migrateAllPosts();
