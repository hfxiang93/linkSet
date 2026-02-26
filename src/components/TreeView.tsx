/*
 * @Descripttion:
 * @Author: xianghaifeng
 * @Date: 2026-02-26 14:29:18
 * @LastEditors: xianghaifeng
 * @LastEditTime: 2026-02-26 16:05:03
 */
import { useMemo, useState } from "react";
import type { TreeNode } from "../utils/tree";

type Props = {
  tree: TreeNode;
  selectedPath: string[];
  onSelect: (path: string[]) => void;
  onAddFolder?: (parent: string[]) => void;
  onRenameFolder?: (path: string[]) => void;
  onDeleteFolder?: (path: string[]) => void;
};

function keyOf(path: string[]) {
  return path.join(">");
}

export default function TreeView({
  tree,
  selectedPath,
  onSelect,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
}: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("linkset:treeCollapsed");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [openKey, setOpenKey] = useState<string | null>(null);

  const entries = useMemo(() => Object.entries(tree.children), [tree]);

  function Node({ node, path }: { node: TreeNode; path: string[] }) {
    const k = keyOf(path);
    const isCollapsed = collapsed[k];
    const hasChildren = Object.keys(node.children).length > 0;
    return (
      <div style={{ marginLeft: 8 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 6,
            cursor: "pointer",
            background:
              path.join("|") === selectedPath.join("|")
                ? "rgba(79,113,255,0.15)"
                : "transparent",
            position: "relative",
          }}
          onClick={() => onSelect(path)}
        >
          {hasChildren && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed((prev) => {
                  const next = { ...prev, [k]: !isCollapsed };
                  try {
                    localStorage.setItem(
                      "linkset:treeCollapsed",
                      JSON.stringify(next)
                    );
                  } catch {}
                  return next;
                });
              }}
              className="tree-toggle"
            >
              {isCollapsed ? "▸" : "▾"}
            </span>
          )}
          <span className="tree-label">{node.name}</span>
          {(onAddFolder || onRenameFolder || onDeleteFolder) && (
            <button
              className="button secondary"
              style={{ marginLeft: "auto", padding: "6px 8px", minHeight: 28 }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenKey((prev) => (prev === k ? null : k));
              }}
              title="更多"
            >
              ⋮
            </button>
          )}
          {openKey === k &&
            (onAddFolder || onRenameFolder || onDeleteFolder) && (
              <div
                style={{
                  position: "absolute",
                  right: 6,
                  top: "100%",
                  marginTop: 4,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 6,
                  display: "grid",
                  gap: 6,
                  zIndex: 10,
                  minWidth: 140,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {onAddFolder && (
                  <button
                    className="button secondary"
                    onClick={() => onAddFolder?.(path)}
                  >
                    新增子目录
                  </button>
                )}
                {onRenameFolder && path.length > 0 && (
                  <button
                    className="button secondary"
                    onClick={() => onRenameFolder?.(path)}
                  >
                    重命名
                  </button>
                )}
                {onDeleteFolder && path.length > 0 && (
                  <button
                    className="button danger"
                    onClick={() => onDeleteFolder?.(path)}
                  >
                    删除此目录
                  </button>
                )}
              </div>
            )}
        </div>
        {!isCollapsed && hasChildren && (
          <div>
            {Object.values(node.children).map((child) => (
              <Node
                key={keyOf([...path, child.name])}
                node={child}
                path={[...path, child.name]}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div onClick={() => setOpenKey(null)}>
      <div
        style={{
          padding: "6px 8px",
          borderRadius: 6,
          cursor: "pointer",
          background:
            selectedPath.length === 0 ? "rgba(79,113,255,0.15)" : "transparent",
        }}
        onClick={() => onSelect([])}
      >
        全部
      </div>
      {onAddFolder && (
        <div style={{ display: "flex", gap: 6, padding: "6px 8px" }}>
          <button className="button secondary" onClick={() => onAddFolder([])}>
            新增顶层目录
          </button>
        </div>
      )}
      {entries.map(([name, node]) => (
        <Node key={name} node={node} path={[name]} />
      ))}
    </div>
  );
}
