import type { LinkItem } from '../types'

export type TreeNode = {
  name: string
  children: Record<string, TreeNode>
}

export function buildTree(items: LinkItem[], folders: string[][] = []): TreeNode {
  const root: TreeNode = { name: '', children: {} }
  function ensure(path: string[]) {
    let node = root
    for (const seg of path) {
      node.children[seg] ||= { name: seg, children: {} }
      node = node.children[seg]
    }
  }
  for (const it of items) {
    const path = it.path && it.path.length ? it.path : ['未分组']
    ensure(path)
  }
  for (const p of folders) {
    const path = p && p.length ? p : ['未分组']
    ensure(path)
  }
  return root
}

export function pathEquals(a: string[] = [], b: string[] = []): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export function pathStartsWith(a: string[] = [], prefix: string[] = []): boolean {
  if (prefix.length === 0) return true
  if (a.length < prefix.length) return false
  for (let i = 0; i < prefix.length; i++) if (a[i] !== prefix[i]) return false
  return true
}
