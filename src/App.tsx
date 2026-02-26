import { useEffect, useMemo, useRef, useState } from "react";
import type { LinkItem } from "./types";
import {
  loadLinks,
  saveLinks,
  exportJSON,
  importJSON,
  loadFolders,
  saveFolders,
} from "./storage";
import LinkCard from "./components/LinkCard";
import LinkEditor from "./components/LinkEditor";
import TreeView from "./components/TreeView";
import Breadcrumb from "./components/Breadcrumb";
import { buildTree, pathEquals, pathStartsWith } from "./utils/tree";
import {
  applyTheme,
  loadTheme,
  saveTheme,
  exportTheme,
  importTheme,
  type ThemeConfig,
} from "./theme";
import ThemeEditor from "./components/ThemeEditor";

function normalizeUrl(u: string) {
  try {
    const url = new URL(u);
    return url.toString();
  } catch {
    return u;
  }
}

async function importBookmarksHTML(file: File): Promise<LinkItem[]> {
  const text = await file.text();
  const dom = new DOMParser().parseFromString(text, "text/html");
  const items: LinkItem[] = [];
  function walk(dl: Element, path: string[]) {
    const children = Array.from(dl.children);
    for (const child of children) {
      if (child.tagName === "DT") {
        const h3 = child.querySelector("h3");
        const a = child.querySelector("a");
        if (h3) {
          const name = h3.textContent?.trim() || "";
          const nextDL =
            child.nextElementSibling &&
            child.nextElementSibling.tagName === "DL"
              ? child.nextElementSibling
              : child.querySelector("dl");
          if (nextDL) walk(nextDL, [...path, name]);
        } else if (a) {
          const href = a.getAttribute("href") || "";
          const name = a.textContent?.trim() || href;
          const url = normalizeUrl(href);
          if (url.startsWith("http")) {
            items.push({ id: crypto.randomUUID(), name, url, path });
          }
        }
      } else if (child.tagName === "DL") {
        walk(child, path);
      }
    }
  }
  const root = dom.querySelector("dl");
  if (root) walk(root, []);
  return items;
}

export default function App() {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LinkItem | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [themeCfg, setThemeCfg] = useState<ThemeConfig>({ mode: "system" });
  const [themeOpen, setThemeOpen] = useState(false);
  const [levelOnly, setLevelOnly] = useState(false);
  const [folders, setFolders] = useState<string[][]>([]);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const htmlInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const data = await loadLinks();
      setItems(data);
      setHydrated(true);
    })();
    (async () => {
      const f = await loadFolders();
      setFolders(f);
    })();
    const cfg = loadTheme();
    setThemeCfg(cfg);
    applyTheme(cfg);
  }, []);

  useEffect(() => {
    if (hydrated) {
      void saveLinks(items);
    }
  }, [items, hydrated]);

  useEffect(() => {
    const c = (globalThis as any).chrome;
    if (!c?.storage?.local) return;
    if (!hydrated) return;
    c.storage.local.get("linkset:inbox", (res: any) => {
      const inbox: any[] = Array.isArray(res["linkset:inbox"])
        ? res["linkset:inbox"]
        : [];
      if (!inbox.length) return;
      const existing = new Set(items.map((i) => i.url));
      const deduped = inbox.filter(
        (i) => i && typeof i.url === "string" && !existing.has(i.url)
      );
      if (!deduped.length) {
        c.storage.local.set({ "linkset:inbox": [] });
        return;
      }
      setItems((prev) => {
        const next = [...deduped, ...prev];
        c.storage.local.set({ "linkset:inbox": [] });
        return next;
      });
    });
  }, [hydrated]);

  useEffect(() => {
    applyTheme(themeCfg);
    saveTheme(themeCfg);
  }, [themeCfg]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (it: LinkItem) =>
        it.name.toLowerCase().includes(s) ||
        it.url.toLowerCase().includes(s) ||
        (it.tags || []).some((t: string) => t.toLowerCase().includes(s)) ||
        (it.path || []).some((p: string) => p.toLowerCase().includes(s))
    );
  }, [items, q]);

  const tree = useMemo(() => buildTree(items, folders), [items, folders]);
  const displaying = useMemo(() => {
    if (selectedPath.length === 0) return filtered;
    const target = selectedPath;
    const getPath = (it: LinkItem) =>
      it.path && it.path.length ? it.path : ["未分组"];
    return filtered.filter((it) =>
      levelOnly
        ? pathEquals(getPath(it), target)
        : pathStartsWith(getPath(it), target)
    );
  }, [filtered, selectedPath, levelOnly]);

  function addItem(item: LinkItem) {
    setItems((prev: LinkItem[]) => [item, ...prev]);
  }
  function updateItem(item: LinkItem) {
    setItems((prev: LinkItem[]) =>
      prev.map((it: LinkItem) => (it.id === item.id ? item : it))
    );
  }
  function deleteItem(id: string) {
    if (!confirm("确定删除该链接？此操作不可恢复")) return;
    setItems((prev: LinkItem[]) => prev.filter((it: LinkItem) => it.id !== id));
  }

  async function handleImportHTML(file?: File) {
    if (!file) return;
    const imported = await importBookmarksHTML(file);
    if (imported.length) {
      const existing = new Set(items.map((i) => i.url));
      const deduped = imported.filter((i) => !existing.has(i.url));
      setItems((prev) => {
        const next = [...deduped, ...prev];
        (async () => {
          const ok = await saveLinks(next);
          if (!ok) {
            alert("存储失败，可能超过浏览器存储容量，请导出JSON备份");
          }
        })();
        return next;
      });
    }
  }

  async function handleImportJSON(file?: File) {
    if (!file) return;
    const imported = await importJSON(file);
    if (imported.length) {
      const existing = new Set(items.map((i) => i.url));
      const deduped = imported.filter((i) => !existing.has(i.url));
      setItems((prev) => {
        const next = [...deduped, ...prev];
        (async () => {
          const ok = await saveLinks(next);
          if (!ok) {
            alert("存储失败，可能超过浏览器存储容量，请导出JSON备份");
          }
        })();
        return next;
      });
    }
  }

  async function importChromeBookmarks() {
    const c = (globalThis as any).chrome;
    if (!c?.bookmarks?.getTree) {
      alert("当前环境不支持 Chrome 书签API，请使用“导入书签HTML”");
      return;
    }
    const tree: any[] = await new Promise((resolve) =>
      c.bookmarks.getTree(resolve)
    );
    const itemsToAdd: LinkItem[] = [];
    function walk(nodes: any[], path: string[]) {
      for (const node of nodes) {
        if (node.url) {
          const url = normalizeUrl(node.url);
          if (url.startsWith("http")) {
            itemsToAdd.push({
              id: crypto.randomUUID(),
              name: node.title || url,
              url,
              path,
            });
          }
        }
        if (node.children && node.children.length) {
          const seg = node.title || "";
          const nextPath = seg ? [...path, seg] : path;
          walk(node.children, nextPath);
        }
      }
    }
    for (const root of tree) {
      if (root.children) walk(root.children, []);
    }
    if (!itemsToAdd.length) {
      alert("未从书签中解析到 http 链接");
      return;
    }
    const existing = new Set(items.map((i) => i.url));
    const deduped = itemsToAdd.filter((i) => !existing.has(i.url));
    setItems((prev) => {
      const next = [...deduped, ...prev];
      (async () => {
        const ok = await saveLinks(next);
        if (!ok) alert("存储失败，可能超过浏览器存储容量，请导出JSON备份");
      })();
      return next;
    });
  }

  function addFolder(parent: string[], name: string) {
    const seg = name.trim();
    if (!seg) return;
    const newPath = [...parent, seg];
    const exists = folders.some(
      (p) => p.length === newPath.length && p.every((v, i) => v === newPath[i])
    );
    if (exists) return;
    const next = [...folders, newPath];
    setFolders(next);
    void saveFolders(next);
  }

  function renameFolder(path: string[], newName: string) {
    const seg = newName.trim();
    if (!seg || !path.length) return;
    const parent = path.slice(0, -1);
    const target = [...parent, seg];
    const updatedFolders = folders.map((p) => {
      if (p.length >= path.length && path.every((v, i) => p[i] === v)) {
        return [...target, ...p.slice(path.length)];
      }
      return p;
    });
    const updatedItems = items.map((it) => {
      const p = it.path && it.path.length ? it.path : ["未分组"];
      if (p.length >= path.length && path.every((v, i) => p[i] === v)) {
        const np = [...target, ...p.slice(path.length)];
        return { ...it, path: np };
      }
      return it;
    });
    setFolders(updatedFolders);
    setItems(updatedItems);
    void saveFolders(updatedFolders);
    void saveLinks(updatedItems);
  }

  function deleteFolder(path: string[]) {
    const remainingFolders = folders.filter(
      (p) => !(p.length >= path.length && path.every((v, i) => p[i] === v))
    );
    const remainingItems = items.filter((it) => {
      const p = it.path && it.path.length ? it.path : ["未分组"];
      return !(p.length >= path.length && path.every((v, i) => p[i] === v));
    });
    setFolders(remainingFolders);
    setItems(remainingItems);
    void saveFolders(remainingFolders);
    void saveLinks(remainingItems);
  }

  return (
    <div className="page">
      <div className="toolbar">
        <input
          type="text"
          placeholder="搜索名称、地址或标签"
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQ(e.target.value)
          }
        />
        <button
          className="button primary"
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          新增链接
        </button>
        <button className="button" onClick={() => exportJSON(items)}>
          导出JSON
        </button>
        {/* <button className="button" onClick={() => exportTheme(themeCfg)}>
          导出主题
        </button> */}
        <button
          className="button"
          onClick={() => jsonInputRef.current?.click()}
        >
          导入JSON
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            ref={jsonInputRef}
            onChange={(e) => handleImportJSON(e.target.files?.[0])}
          />
        </button>
        {/* <label className="button">
          导入主题
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const cfg = await importTheme(f);
              if (cfg) setThemeCfg(cfg);
            }}
          />
        </label> */}
        <button
          className="button"
          onClick={() => htmlInputRef.current?.click()}
        >
          导入书签HTML
          <input
            type="file"
            accept=".html,text/html"
            style={{ display: "none" }}
            ref={htmlInputRef}
            onChange={(e) => handleImportHTML(e.target.files?.[0])}
          />
        </button>
        <button className="button" onClick={importChromeBookmarks}>
          从浏览器书签导入
        </button>
        {/* <button
          className="button"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <input
            type="checkbox"
            checked={levelOnly}
            onChange={(e) => setLevelOnly(e.target.checked)}
          />
          仅当前层级
        </button> */}
        <button
          className="button"
          onClick={async () => {
            const c = (globalThis as any).chrome;
            if (!c?.storage?.sync) {
              alert("当前环境不支持云端同步");
              return;
            }
            await new Promise((resolve) =>
              c.storage.sync.set({ "linkset:links": items }, resolve)
            );
            alert("已同步到云端");
          }}
        >
          云端同步
        </button>
        <button
          className="button"
          onClick={async () => {
            const c = (globalThis as any).chrome;
            if (!c?.storage?.sync) {
              alert("当前环境不支持云端同步");
              return;
            }
            const data = await new Promise<any>((resolve) =>
              c.storage.sync.get("linkset:links", resolve)
            );
            const arr: any[] = Array.isArray(data["linkset:links"])
              ? data["linkset:links"]
              : [];
            if (!arr.length) {
              alert("云端暂无数据");
              return;
            }
            const existing = new Set(items.map((i) => i.url));
            const deduped = arr.filter(
              (i) => i && typeof i.url === "string" && !existing.has(i.url)
            );
            setItems((prev) => [...deduped, ...prev]);
          }}
        >
          从云端拉取
        </button>
        <select
          className="button"
          value={themeCfg.mode}
          onChange={(e) =>
            setThemeCfg((prev) => ({
              ...prev,
              mode: e.target.value as ThemeConfig["mode"],
            }))
          }
        >
          <option value="system">跟随系统</option>
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="custom">自定义</option>
        </select>
        <button className="button" onClick={() => setThemeOpen(true)}>
          自定义主题
        </button>
      </div>

      <div className="layout">
        <div className="sidebar">
          <TreeView
            tree={tree}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
            onAddFolder={(parent) => {
              const name = prompt("请输入新目录名称");
              if (!name) return;
              addFolder(parent, name);
            }}
            onRenameFolder={(path) => {
              const name = prompt("请输入新名称", path[path.length - 1] || "");
              if (!name) return;
              renameFolder(path, name);
            }}
            onDeleteFolder={(path) => {
              if (!confirm("删除该目录将同时删除其下的所有链接，确定继续？"))
                return;
              deleteFolder(path);
            }}
          />
        </div>
        <div>
          <Breadcrumb path={selectedPath} onSelect={setSelectedPath} />
          {selectedPath.length === 0 ? (
            (() => {
              const groups = new Map<string, LinkItem[]>();
              for (const it of displaying) {
                const key = it.path && it.path.length ? it.path[0] : "未分组";
                const arr = groups.get(key) || [];
                arr.push(it);
                groups.set(key, arr);
              }
              return Array.from(groups.entries()).map(([folder, list]) => (
                <div key={folder}>
                  <h3 style={{ margin: "16px 0 8px" }}>{folder}</h3>
                  <div className="grid">
                    {list.map((item: LinkItem) => (
                      <LinkCard
                        key={item.id}
                        item={item}
                        onEdit={(it: LinkItem) => {
                          setEditing(it);
                          setOpen(true);
                        }}
                        onDelete={deleteItem}
                      />
                    ))}
                  </div>
                </div>
              ));
            })()
          ) : (
            <div className="grid">
              {displaying.map((item: LinkItem) => (
                <LinkCard
                  key={item.id}
                  item={item}
                  onEdit={(it: LinkItem) => {
                    setEditing(it);
                    setOpen(true);
                  }}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <LinkEditor
        open={open}
        initial={editing}
        onClose={() => setOpen(false)}
        onSubmit={(item) => (editing ? updateItem(item) : addItem(item))}
      />
      <ThemeEditor
        open={themeOpen}
        initial={themeCfg}
        onClose={() => setThemeOpen(false)}
        onSubmit={(cfg) => setThemeCfg(cfg)}
      />
    </div>
  );
}
