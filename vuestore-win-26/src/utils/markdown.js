import { marked } from 'marked'

export function parseMarkdown(markdown) {
  if (!markdown) return ''
  return marked(markdown)
}

export function extractMarkdownFromRichText(richText) {
  if (!richText || !richText.root || !richText.root.children) return ''

  let markdown = ''

  function traverse(node) {
    if (node.type === 'text' && node.text) {
      markdown += node.text
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child))
    }
  }

  traverse(richText.root)
  return markdown
}
