/*
 * @Descripttion:
 * @Author: xianghaifeng
 * @Date: 2026-02-26 13:55:01
 * @LastEditors: xianghaifeng
 * @LastEditTime: 2026-02-26 15:06:36
 */
import { useEffect, useState } from "react";
import type { LinkItem } from "../types";

type Props = {
  open: boolean;
  initial?: LinkItem;
  onClose: () => void;
  onSubmit: (item: LinkItem) => void;
};

export default function LinkEditor({
  open,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [pathInput, setPathInput] = useState("");

  useEffect(() => {
    setName(initial?.name ?? "");
    setUrl(initial?.url ?? "");
    setPathInput((initial?.path || []).join("/"));
  }, [initial, open]);

  if (!open) return null;

  function handleSubmit() {
    const item: LinkItem = {
      id: initial?.id ?? crypto.randomUUID(),
      name: name || url,
      url,
      tags: initial?.tags,
      path: pathInput
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onSubmit(item);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <h3>{initial ? "编辑链接" : "新增链接"}</h3>
        <div className="form-row">
          <label>名称</label>
          <input
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            placeholder="示例：GitHub"
          />
        </div>
        <div className="form-row">
          <label>地址</label>
          <input
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUrl(e.target.value)
            }
            placeholder="https://example.com"
          />
        </div>
        <div className="form-row">
          <label>目录路径</label>
          <input
            value={pathInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPathInput(e.target.value)
            }
            placeholder="示例：工作/前端"
          />
        </div>
        <div className="modal-actions">
          <button className="button" onClick={onClose}>
            取消
          </button>
          <button className="button primary" onClick={handleSubmit}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
