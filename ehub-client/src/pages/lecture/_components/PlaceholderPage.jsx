/**
 * Trang placeholder — hiển thị khi chưa có nội dung thật, tránh 404.
 */
export default function PlaceholderPage({ title, description }) {
  return (
    <div className="rounded-lg bg-white p-5 sm:p-6 md:p-8 shadow-sm">
      <h1 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h1>
      <p className="mt-2 text-sm sm:text-base text-gray-500">{description}</p>
      <p className="mt-4 text-xs sm:text-sm text-gray-400">Trang này đang được phát triển.</p>
    </div>
  );
}
