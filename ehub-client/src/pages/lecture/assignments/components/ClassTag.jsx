export default function ClassTag({ classCode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface text-text-secondary border border-border">
      Lớp: {classCode}
    </span>
  );
}
