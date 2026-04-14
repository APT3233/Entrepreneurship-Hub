import { Users, Info } from "lucide-react";

/**
 * Empty state when student has no group and no pending invites (dashboard / groups).
 */
export default function StudentNoGroupEmptyState({ className = "" }) {
  return (
    <div
      className={`mx-auto flex w-full max-w-3xl flex-col items-stretch justify-center gap-5 py-8 min-h-[min(56svh,32rem)] sm:gap-6 sm:py-12 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm sm:rounded-3xl sm:px-14 sm:py-14">
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 via-violet-50 to-violet-100 sm:mb-8 sm:h-24 sm:w-24"
          aria-hidden
        >
          <Users className="h-10 w-10 text-violet-600 sm:h-12 sm:w-12" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Bạn chưa tham gia nhóm nào
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">
          Giảng viên sẽ tạo nhóm cho lớp. Khi bạn được thêm vào nhóm, thông tin sẽ hiển thị tại đây.
        </p>
        <div className="mt-10 flex justify-center gap-2" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div
            className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 sm:mx-0 sm:h-14 sm:w-14 sm:rounded-2xl"
            aria-hidden
          >
            <Info className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">Thông tin về nhóm học tập</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:mt-2.5 sm:text-base">
              Nhóm học tập giúp bạn cộng tác với các bạn cùng lớp trong việc thực hiện các bài tập và dự án. Bạn sẽ nhận được thông báo khi được thêm vào nhóm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
