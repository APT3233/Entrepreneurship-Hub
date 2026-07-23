import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import { authApi } from "@/api/auth";
import { selectAuth, setError, setUser } from "@/store/slices/authSlice";
import { Roles } from "@/constants/roles";
import { getDefaultRouteForUser, hasAnyRole } from "@/utils/role";
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from "@/components/icons/auth";
import { GraduationCapIcon, LectureIcon } from "@/components/icons/education";
import { AlertCircleIcon } from "@/components/icons/ui";
import GoogleButton from "@/components/ui/Button/GoogleButton";
import StudentNotInRosterModal from "@/components/modal/auth/StudentNotInRosterModal";
import GoogleAccessDeniedModal from "@/components/modal/auth/GoogleAccessDeniedModal";
import {
  API_ERROR_ACCOUNT_LOCKED,
  API_ERROR_STUDENT_NOT_IN_ROSTER,
  API_ERROR_INSUFFICIENT_PERMISSION,
} from "@/constants/apiErrors";

// ─── Sub-components ───────────────────────────────────────────────────────────
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium
      transition-all duration-200 cursor-pointer
      ${active ? "bg-accent-bg text-accent" : "text-text-secondary hover:text-text-primary"}`}
  >
    {icon}
    {label}
  </button>
);

const FieldError = ({ message }) =>
  message ? (
    <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500" style={{ animation: "fadeSlideIn 0.2s ease" }}>
      <AlertCircleIcon />
      {message}
    </p>
  ) : null;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const toast = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [role, setRole] = useState(Roles.STUDENT);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ id: "", password: "", general: "" });
  const [notInRosterModalOpen, setNotInRosterModalOpen] = useState(false);
  const [googleAccessDeniedOpen, setGoogleAccessDeniedOpen] = useState(false);

  const { user, isAuthenticated, isLoading, error: authError } = useSelector(selectAuth);
  const isStudent = role === Roles.STUDENT;

  const clearErrors = () => {
    setFieldErrors({ id: "", password: "", general: "" });
    dispatch(setError(null));
  };

  useEffect(() => {
    if (searchParams.get("locked") !== "1") return;
    const msg = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.";
    setFieldErrors({ id: "", password: "", general: msg });
    toast.error("Tài khoản bị khóa", msg);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, toast]);

  const getGoogleErrorMessage = (code) => {
    const messages = {
      missing_code: "Đăng nhập Google bị hủy hoặc thiếu mã. Vui lòng thử lại.",
      access_denied: "Bạn đã từ chối đăng nhập bằng Google.",
      redirect_uri_mismatch: "Cấu hình redirect URI chưa đúng. Liên hệ quản trị viên.",
    };
    return messages[code] || (code ? `Đăng nhập Google thất bại: ${code}` : "Đăng nhập Google thất bại.");
  };

  // Xử lý redirect từ Google callback: thành công → /me + Redux + navigate; thất bại → Redux error + hiển thị
  useEffect(() => {
    const googleErrCode = searchParams.get("google_error");
    if (googleErrCode) {
      dispatch(setError(null));
      setFieldErrors((prev) => ({ ...prev, general: "" }));
      if (googleErrCode === API_ERROR_INSUFFICIENT_PERMISSION) {
        setGoogleAccessDeniedOpen(true);
      } else {
        toast.error(
          "Đăng nhập Google thất bại",
          "Vui lòng thử lại hoặc liên hệ quản trị viên."
        );
      }
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        n.delete("google_error");
        return n;
      }, { replace: true });
      return;
    }

    const googleLogin = searchParams.get("google_login");
    const error = searchParams.get("error");

    if (error) {
      const message = getGoogleErrorMessage(error);
      dispatch(setError(message));
      setFieldErrors((prev) => ({ ...prev, general: message }));
      toast.error(message);
      setSearchParams({}, { replace: true });
      return;
    }

    if (googleLogin !== "success") return;

    setGoogleLoading(true);
    dispatch(setError(null));
    let mounted = true;

    authApi
      .me()
      .then((res) => {
        if (!mounted) return;
        const user = res?.data;
        if (user) {
          dispatch(setUser(user));
          setFieldErrors({ id: "", password: "", general: "" });
          const msg = `Chào ${user.full_name || user.username || "bạn"}! Đăng nhập Google thành công.`;
          setSuccessMsg(msg);
          toast.success("Đăng nhập Google thành công", msg);
          setSearchParams({}, { replace: true });
          const targetRoute = getDefaultRouteForUser(user);
          setTimeout(() => navigate(targetRoute, { replace: true }), 150);
        } else {
          const msg = "Không nhận được thông tin tài khoản.";
          dispatch(setError(msg));
          setFieldErrors((prev) => ({ ...prev, general: msg }));
          toast.error(msg);
          setSearchParams({}, { replace: true });
        }
      })
      .catch((err) => {
        if (!mounted) return;
        const message = err?.message || "Không lấy được thông tin sau đăng nhập Google. Vui lòng thử lại.";
        dispatch(setError(message));
        setFieldErrors((prev) => ({ ...prev, general: message }));
        toast.error(message);
        setSearchParams({}, { replace: true });
      })
      .finally(() => {
        if (mounted) setGoogleLoading(false);
      });

    return () => { mounted = false; };
  }, [searchParams, setSearchParams, dispatch, navigate, toast]);

  // Nếu đã đăng nhập mà vẫn cố vào /auth/login (vd: bấm Back) → auto redirect về route mặc định
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const targetRoute = getDefaultRouteForUser(user);
      navigate(targetRoute, { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleGoogleLogin = () => {
    dispatch(setError(null));
    setFieldErrors((prev) => ({ ...prev, general: "" }));
    window.location.href = authApi.getGoogleLoginUrl();
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setId("");
    setPassword("");
    setShowPassword(false);
    setSuccessMsg("");
    setNotInRosterModalOpen(false);
    setGoogleAccessDeniedOpen(false);
    clearErrors();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");

    // ── Client-side validation ──
    const errors = { id: "", password: "", general: "" };
    let hasError = false;

    if (!id.trim()) {
      errors.id = isStudent
        ? "Vui lòng nhập mã sinh viên."
        : "Vui lòng nhập email.";
      hasError = true;
    }
    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      toast.warning("Thiếu thông tin", "Vui lòng kiểm tra lại các trường bắt buộc.");
      return;
    }

    clearErrors();
    setLoading(true);
    dispatch(setError(null));

    try {
      const result = await authApi.login({ username: id.trim(), password });
      const user = result?.data?.user ?? result?.data;
      if (!user) throw new Error("Không lấy được thông tin người dùng.");
      if (role === Roles.STUDENT && !hasAnyRole(user, [Roles.STUDENT])) throw new Error("Tài khoản này không phải sinh viên.");
      if (role === Roles.LECTURER && !hasAnyRole(user, [Roles.LECTURER, Roles.ADMIN, Roles.DEPARTMENT_HEAD, Roles.MENTOR])) throw new Error("Tài khoản này không thuộc cổng giảng viên/quản trị/mentor.");
      dispatch(setUser(user));
      const msg = `Chào mừng, ${user.full_name || user.username || "bạn"}! Đăng nhập thành công.`;
      setSuccessMsg(msg);
      toast.success("Đăng nhập thành công", msg);
      const targetRoute = getDefaultRouteForUser(user);
      setTimeout(() => navigate(targetRoute, { replace: true }), 150);
    } catch (err) {
      if (isStudent && err?.code === API_ERROR_STUDENT_NOT_IN_ROSTER) {
        dispatch(setError(null));
        setFieldErrors({ id: "", password: "", general: "" });
        setNotInRosterModalOpen(true);
        return;
      }
      if (err?.code === API_ERROR_ACCOUNT_LOCKED) {
        const lockedMsg = err?.message || "Tài khoản của bạn đã bị khóa.";
        setFieldErrors({ id: "", password: "", general: lockedMsg });
        toast.error("Tài khoản bị khóa", lockedMsg);
        return;
      }
      const errMsg = err?.message || "Đăng nhập thất bại.";
      dispatch(setError(errMsg));
      setFieldErrors({ id: "error", password: "error", general: errMsg });
      toast.error("Đăng nhập thất bại", errMsg);
    } finally {
      setLoading(false);
    }
  };

  // dynamic wrapper class per field
  const inputWrapClass = (key) => {
    const base = "flex items-center rounded-xl px-3 py-3 gap-2 transition-all duration-150";
    if (fieldErrors[key]) {
      return `${base} bg-red-50 border border-red-400 ring-2 ring-red-100`;
    }
    return `${base} bg-gray-100 border border-transparent focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 bg-page">
      {/* Fonts + keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60%  { transform: translateX(-5px); }
          40%, 80%  { transform: translateX(5px); }
        }

        .field-error-shake { animation: shake 0.35s ease; }
      `}</style>

      {/* Card */}
      <div
        className="bg-surface rounded-card p-6 sm:p-8 lg:p-10 w-full border border-border"
        style={{ maxWidth: "400px" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #4F39F6 100%)" }}
          >
            <GraduationCapIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
             E-HUB
          </h1>
          <p className="text-sm text-gray-400 mt-1">Đăng nhập để tiếp tục</p>
        </div>

        {/* Role Tabs */}
        <div className="flex bg-subtle rounded-full p-1 mb-7">
          <TabButton
            active={isStudent}
            onClick={() => handleRoleChange(Roles.STUDENT)}
            icon={<UserIcon />}
            label="Student"
          />
          <TabButton
            active={!isStudent}
            onClick={() => handleRoleChange(Roles.LECTURER)}
            icon={<LectureIcon />}
            label="Lecturer / Mentor"
          />
        </div>

        {/* Form Card */}
        <div className="rounded-2xl p-6 bg-white" style={{ border: "1px solid #EEEEEE" }}>
          <h2 className="text-base font-bold text-gray-900">
            {isStudent ? "Đăng nhập sinh viên" : "Đăng nhập giảng viên / mentor"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-5">
            {isStudent
              ? "Nhập thông tin tài khoản sinh viên của bạn"
              : "Nhập thông tin tài khoản giảng viên / mentor của bạn"}
          </p>

          {/* ── General error banner (form + Google) ── */}
          {(fieldErrors.general && fieldErrors.general !== "error") || authError ? (
            <div
              className="flex items-center gap-2 mb-5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
              style={{ animation: "fadeSlideIn 0.2s ease" }}
            >
              <AlertCircleIcon />
              {(fieldErrors.general && fieldErrors.general !== "error") ? fieldErrors.general : authError}
            </div>
          ) : null}

          {/* ── Success banner ── */}
          {successMsg && (
            <div
              className="flex items-center gap-2 mb-5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5"
              style={{ animation: "fadeSlideIn 0.2s ease" }}
            >
              ✓ {successMsg}
            </div>
          )}

          {/* ── Google (above the form) ── */}
          {googleLoading ? (
            <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-sm">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Đang xử lý đăng nhập Google...
            </div>
          ) : (
            <GoogleButton onClick={handleGoogleLogin} disabled={loading} />
          )}

          {/* ── "hoặc" divider ── */}
          <div className="relative flex items-center justify-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-surface px-3 text-xs font-medium text-text-muted">hoặc</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* ── ID Field ── */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                {isStudent ? "Mã sinh viên" : "Email"}
              </label>
              <div className={`${inputWrapClass("id")} ${fieldErrors.id ? "field-error-shake" : ""}`}>
                <UserIcon hasError={!!fieldErrors.id} />
                <input
                  type="text"
                  value={id}
                  autoComplete="email"
                  onChange={(e) => {
                    setId(e.target.value);
                    if (fieldErrors.id || fieldErrors.general) {
                      setFieldErrors((p) => ({ ...p, id: "", general: "" }));
                      dispatch(setError(null));
                    }
                  }}
                  placeholder={isStudent ? "VD: DE123456" : "VD: gv@fpt.edu.vn"}
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                />
              </div>
              <FieldError message={fieldErrors.id === "error" ? "" : fieldErrors.id} />
            </div>

            {/* ── Password Field ── */}
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Mật khẩu
              </label>
              <div className={`${inputWrapClass("password")} ${fieldErrors.password ? "field-error-shake" : ""}`}>
                <LockIcon hasError={!!fieldErrors.password} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password || fieldErrors.general) {
                      setFieldErrors((p) => ({ ...p, password: "", general: "" }));
                      dispatch(setError(null));
                    }
                  }}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none flex items-center justify-center cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <FieldError message={fieldErrors.password === "error" ? "" : fieldErrors.password} />
            </div>

            {/* ── Remember & Forgot ── */}
            <div className="flex items-center justify-between mt-4 mb-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-indigo-600"
                />
                <span className="text-xs text-gray-500">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                className="text-xs font-semibold cursor-pointer hover:underline"
                style={{ color: "#4F39F6" }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold tracking-wide
                transition-all duration-200 hover:opacity-90 active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: "#4F39F6" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>

      </div>

      <StudentNotInRosterModal
        isOpen={notInRosterModalOpen}
        onClose={() => setNotInRosterModalOpen(false)}
      />
      <GoogleAccessDeniedModal
        isOpen={googleAccessDeniedOpen}
        onClose={() => setGoogleAccessDeniedOpen(false)}
      />
    </div>
  );
}
