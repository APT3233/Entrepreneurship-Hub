import { Users, Info } from "lucide-react";

/**
 * Empty state when student has no group and no pending invites (dashboard / groups).
 * Styled according to the premium design mockup.
 */
export default function StudentNoGroupEmptyState({ className = "" }) {
  return (
    <div
      className={`mx-auto flex w-full max-w-4xl flex-col items-stretch justify-center gap-6 py-12 ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Top Box: Main Empty State */}
      <div className="rounded-[32px] border border-gray-100 bg-white px-8 py-16 text-center shadow-sm sm:px-14">
        <div
          className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-100 shadow-inner"
          aria-hidden
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/40 backdrop-blur-sm">
            <Users className="h-10 w-10 text-violet-600" strokeWidth={2.5} />
          </div>
        </div>
        
        <h2 className="text-[32px] font-black tracking-tight text-gray-900 leading-tight">
          Bạn chưa tham gia nhóm nào
        </h2>
        
        <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed font-medium text-gray-500">
          Giảng viên sẽ tạo nhóm cho lớp. Khi bạn được thêm vào nhóm, thông tin sẽ hiển thị tại đây.
        </p>
        
        <div className="mt-12 flex justify-center gap-2.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-gray-200" />
          <span className="h-2 w-2 rounded-full bg-gray-200" />
          <span className="h-2 w-2 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Bottom Box: Info/Guidance */}
      <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div
            className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100/80 text-violet-600 sm:mx-0 sm:h-16 sm:w-16 sm:rounded-3xl"
            aria-hidden
          >
            <Info className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Thông tin về nhóm học tập</h3>
            <p className="mt-2 text-base leading-relaxed font-medium text-gray-500">
              Nhóm học tập giúp bạn cộng tác với các bạn cùng lớp trong việc thực hiện các bài tập và dự án. Bạn sẽ nhận được thông báo khi được thêm vào nhóm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
