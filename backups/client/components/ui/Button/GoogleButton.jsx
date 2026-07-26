import { GoogleLogo } from "@/components/icons/auth";


export default function GoogleButton({ onClick, disabled, className = "", children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
        bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium
        transition-all duration-200 hover:bg-gray-100 hover:border-gray-400
        active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer
        ${className}
      `}
    >
      <GoogleLogo />
      {children ?? "Đăng nhập với Google"}
    </button>
  );
}
