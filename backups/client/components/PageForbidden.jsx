import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function PageForbidden() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">403 Forbidden</h1>
        <p className="mt-2 text-sm text-gray-500">
          Bạn không có quyền truy cập khu vực này.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Về trang phù hợp
        </Link>
      </div>
    </div>
  );
}
