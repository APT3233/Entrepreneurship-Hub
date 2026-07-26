import { useRouteError } from "react-router-dom";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { isChunkLoadError, reloadOnceForChunkError } from "@/utils/chunkLoadRecovery";

function ChunkReloading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
          <RefreshCw size={24} className="animate-spin" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Đang tải lại phiên bản mới...</h1>
        <p className="mt-2 text-sm text-gray-500">
          Ứng dụng vừa được cập nhật hoặc mất kết nối tạm thời. Trang sẽ tự tải lại.
        </p>
      </div>
    </div>
  );
}

export default function GlobalErrorBoundary() {
  const error = useRouteError();

  if (isChunkLoadError(error)) {
    if (reloadOnceForChunkError()) {
      return <ChunkReloading />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertCircle size={24} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">Đã xảy ra lỗi ứng dụng</h1>
        <p className="mt-2 text-sm text-gray-500">
          Hệ thống vừa cập nhật phiên bản mới hoặc gặp sự cố kết nối. Hãy tải lại trang để tiếp tục.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-700 transition-colors"
          >
            <RefreshCw size={16} />
            Tải lại trang
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = "/"; }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Home size={16} />
            Về trang chủ
          </button>
        </div>

        {error ? (
          <details className="mt-6 text-left border-t border-gray-100 pt-4">
            <summary className="cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-600 select-none">
              Chi tiết kỹ thuật
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded-xl bg-gray-50 p-3 text-left font-mono text-[11px] text-gray-500 whitespace-pre-wrap leading-relaxed">
              {error.stack || error.message || String(error)}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
