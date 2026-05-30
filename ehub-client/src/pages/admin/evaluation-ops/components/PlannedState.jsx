import { Construction } from "lucide-react";

export default function PlannedState({ title = "API chưa triển khai", message, actions }) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-sm text-blue-900">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm">
          <Construction size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{title}</p>
          <p className="mt-1 leading-6 text-blue-800">{message}</p>
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
