import type { LinkItem } from "../types";

type Props = {
  item: LinkItem;
  onEdit: (item: LinkItem) => void;
  onDelete: (id: string) => void;
};

function favicon(url: string) {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
    url
  )}`;
}

export default function LinkCard({ item, onEdit, onDelete }: Props) {
  return (
    <div
      className="card"
      onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
    >
      <img className="favicon" src={favicon(item.url)} alt="" />
      <a
        className="link title"
        href={item.url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {item.name}
      </a>
      <div className="actions">
        <button
          className="button secondary icon"
          title="编辑"
          aria-label="编辑"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
        >
          ✎
        </button>
        <button
          className="button danger icon"
          title="删除"
          aria-label="删除"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
