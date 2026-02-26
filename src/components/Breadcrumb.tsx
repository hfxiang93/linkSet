/*
 * @Descripttion:
 * @Author: xianghaifeng
 * @Date: 2026-02-26 14:29:26
 * @LastEditors: xianghaifeng
 * @LastEditTime: 2026-02-26 14:29:42
 */
type Props = {
  path: string[];
  onSelect: (path: string[]) => void;
};

export default function Breadcrumb({ path, onSelect }: Props) {
  const segments = path;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
      }}
    >
      <a className="link" onClick={() => onSelect([])}>
        全部
      </a>
      {segments.map((seg, idx) => (
        <span
          key={idx}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span style={{ color: "var(--muted)" }}>/</span>
          <a
            className="link"
            onClick={() => onSelect(segments.slice(0, idx + 1))}
          >
            {seg}
          </a>
        </span>
      ))}
    </div>
  );
}
