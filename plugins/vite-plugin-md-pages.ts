import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, dirname, basename, extname } from 'node:path'
import MarkdownIt from 'markdown-it'
import Shiki from '@shikijs/markdown-it'
import type { Plugin } from 'vite'
// Import Lass TextMate grammar for build-time syntax highlighting
import lassGrammar from '../../../packages/lass-tmlanguage/lass.tmLanguage.json' with { type: 'json' }

/** Strip YAML frontmatter (--- ... ---) from markdown content */
function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)
  return match ? content.slice(match[0].length) : content
}

/** Transform <test-case> tags into styleable <div> wrappers */
function preprocessTestCases(content: string): string {
  return content
    .replace(/<test-case\s+[^>]*>/g, (match) => {
      const type = match.match(/type=["'](valid|invalid)["']/)?.[1] || 'valid'
      return `<div class="test-case" data-type="${type}">\n`
    })
    .replace(/<\/test-case>/g, '</div>')
}

/** Known Shiki languages — map unknown fenced code languages to plaintext */
const KNOWN_LANGS = new Set([
  'lass', 'javascript', 'typescript', 'css', 'html', 'bash', 'json',
  'scss', 'toml', 'markdown', 'yaml', 'js', 'ts',
])

function normalizeCodeFences(content: string): string {
  return content.replace(/^```(\S+)/gm, (match, lang) => {
    // Strip filename-style langs like "tokens.json" to just "json"
    const ext = lang.split('.').pop()
    if (KNOWN_LANGS.has(ext)) return '```' + ext
    if (KNOWN_LANGS.has(lang)) return match
    return '```text'
  })
}

/** Directories to skip when scanning for content files */
const SKIP_DIRS = new Set(['node_modules', '.git', 'docs', 'plugins', 'styles', 'public'])

/** Recursively find all .md files under the content directory */
function findContentFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...findContentFiles(full))
    } else if (entry.endsWith('.md')) {
      results.push(full)
    }
  }
  return results
}

/**
 * Derive the output path for a content file.
 *
 * content/index.md                          → index.html
 * content/getting-started/index.md          → getting-started/index.html
 * content/syntax/index.md                   → syntax/index.html
 * content/axioms/style-lookup.common.md     → axioms/style-lookup/index.html
 * content/axioms/style-lookup.extra-cases.md→ axioms/style-lookup/extra-cases/index.html
 * content/documentation/axiom-format-spec.md→ documentation/axiom-format-spec/index.html
 */
function deriveOutputPath(filePath: string, contentDir: string): string {
  const rel = relative(contentDir, filePath)
  const dir = dirname(rel)
  const name = basename(rel, '.md')

  // index.md files keep their directory path
  if (name === 'index') {
    return dir === '.' ? 'index.html' : `${dir}/index.html`
  }

  // *.common.md → strip .common suffix, create directory
  if (name.endsWith('.common')) {
    const slug = name.slice(0, -'.common'.length)
    return dir === '.' ? `${slug}/index.html` : `${dir}/${slug}/index.html`
  }

  // *.extra-cases.md → nested under feature directory
  if (name.endsWith('.extra-cases')) {
    const slug = name.slice(0, -'.extra-cases'.length)
    return dir === '.' ? `${slug}/extra-cases/index.html` : `${dir}/${slug}/extra-cases/index.html`
  }

  // Other .md files → create directory from filename
  return dir === '.' ? `${name}/index.html` : `${dir}/${name}/index.html`
}

export interface MdPagesOptions {
  template: string
}

export async function mdPages(options: MdPagesOptions): Promise<Plugin> {
  const shikiPlugin = await Shiki({
    themes: { dark: 'github-dark', light: 'github-light' },
    defaultColor: 'dark',
    langs: [
      {
        ...lassGrammar,
        name: 'lass',
      },
      'javascript', 'typescript', 'css', 'html', 'bash', 'json', 'scss', 'toml', 'markdown', 'yaml'
    ],
  })

  const md = new MarkdownIt({ html: true })
  md.use(shikiPlugin)

  return {
    name: 'vite-plugin-md-pages',
    apply: 'build',
    enforce: 'post',

    generateBundle(_, bundle) {
      const root = process.cwd()
      const contentDir = join(root, 'content')
      const templatePath = join(root, options.template)
      const template = readFileSync(templatePath, 'utf-8')

      // Find the CSS asset emitted by Vite (compiled from .lass imports)
      let cssPath = ''
      for (const [fileName] of Object.entries(bundle)) {
        if (fileName.endsWith('.css')) {
          cssPath = fileName.startsWith('assets/') ? fileName : `assets/${fileName}`
          break
        }
      }

      // Remove Vite's default index.html and JS entry — we generate our own pages
      for (const fileName of Object.keys(bundle)) {
        if (fileName === 'index.html' || fileName.endsWith('.js')) {
          delete bundle[fileName]
        }
      }

      // Copy llms.txt as a raw asset
      const llmsPath = join(contentDir, 'llms.txt')
      try {
        const llmsContent = readFileSync(llmsPath, 'utf-8')
        this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsContent })
      } catch {}

      const contentFiles = findContentFiles(contentDir)

      for (const file of contentFiles) {
        const raw = readFileSync(file, 'utf-8')
        const stripped = stripFrontmatter(raw)
        const normalized = normalizeCodeFences(stripped)
        const preprocessed = preprocessTestCases(normalized)
        const html = md.render(preprocessed)

        const outPath = deriveOutputPath(file, contentDir)

        // Calculate relative paths based on page depth
        const outDir = dirname(outPath)
        const depth = outDir === '.' ? 0 : outDir.split('/').length
        const rootPrefix = depth > 0 ? '../'.repeat(depth) : ''

        const cssRelativePath = rootPrefix + cssPath

        const page = template
          .replace('{{content}}', html)
          .replace('{{css}}', cssRelativePath)
          .split('{{root}}').join(rootPrefix || './')

        this.emitFile({
          type: 'asset',
          fileName: outPath,
          source: page,
        })
      }
    },
  }
}
