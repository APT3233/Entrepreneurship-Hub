import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useToast } from "@/components/ui/Toast";
import { authApi } from "@/api/auth";
import { selectAuth, setError, setUser } from "@/store/slices/authSlice";
import { getDefaultRouteForUser, hasAnyRole } from "@/utils/role";
import { Roles } from "@/constants/roles";
import { GraduationCapIcon } from "@/components/icons/education";
import { LockIcon } from "@/components/icons/auth";
import { AlertCircleIcon } from "@/components/icons/ui";

export default function ActivatePage() {
  const toast = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const { isAuthenticated, isLoading, user } = useSelector(selectAuth);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadPreview = useCallback(async () => {
    if (!token || token.length !== 64) {
      setPreviewError("Thiếu hoặc sai mã liên kết kích hoạt.");
      setLoadingPreview(false);
      return;
    }
    setLoadingPreview(true);
    setPreviewError("");
    try {
      const res = await authApi.activatePreview(token);
      const data = res?.data ?? res;
      setPreview(data);
    } catch (e) {
      setPreviewError(e?.message || "Liên kết không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoadingPreview(false);
    }
  }, [token]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate(getDefaultRouteForUser(user), { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (password.length < 6) {
      setFormError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirm) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSubmitting(true);
    dispatch(setError(null));
    try {
      const result = await authApi.activate({ token, password });
      const u = result?.data?.user ?? result?.data;
      if (!u) throw new Error("Không lấy được thông tin người dùng.");
      if (!hasAnyRole(u, [Roles.STUDENT])) {
        throw new Error("Tài khoản không có quyền sinh viên.");
      }
      dispatch(setUser(u));
      toast.success("Kích hoạt thành công", "Chào mừng bạn đến với E-HUB.");
      navigate(getDefaultRouteForUser(u), { replace: true });
    } catch (err) {
      const msg = err?.message || "Kích hoạt thất bại.";
      setFormError(msg);
      dispatch(setError(msg));
      toast.error("Kích hoạt thất bại", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8"
      style={{
        background:
          "linear-gradient(138.81deg, rgba(247, 249, 255, 0.63) 55.36%, rgba(8, 145, 178, 0.063) 148.33%)",
      }}
    >
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 w-full"
        style={{ boxShadow: "14px 16px 30px 9px #00000014", maxWidth: "520px" }}
      >
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #4F39F6 100%)" }}
          >
            <GraduationCapIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">E-HUB</h1>
          <p className="text-sm text-gray-400 mt-1">Kích hoạt tài khoản sinh viên</p>
        </div>

        <div className="rounded-2xl p-6 bg-white" style={{ border: "1px solid #EEEEEE" }}>
          {loadingPreview ? (
            <p className="text-sm text-gray-500 text-center py-6">Đang kiểm tra liên kết…</p>
          ) : previewError ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-4">
                <AlertCircleIcon />
                {previewError}
              </div>
              <Link to="/auth/login" className="text-sm text-indigo-600 font-medium hover:underline">
                Về trang đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-1">
                Lớp: <span className="font-semibold text-gray-800">{preview?.classCode}</span>
              </p>
              <p className="text-xs text-gray-500 mb-5">
                Email: <span className="font-semibold text-gray-800">{preview?.emailMasked}</span>
              </p>
              <form onSubmit={handleSubmit} noValidate>
                {formError ? (
                  <div className="flex items-center gap-2 mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircleIcon />
                    {formError}
                  </div>
                ) : null}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Mật khẩu</label>
                  <div className="flex items-center rounded-xl px-3 py-3 gap-2 bg-gray-100 border border-transparent focus-within:border-indigo-400">
                    <LockIcon />
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Xác nhận mật khẩu</label>
                  <div className="flex items-center rounded-xl px-3 py-3 gap-2 bg-gray-100 border border-transparent focus-within:border-indigo-400">
                    <LockIcon />
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Đang xử lý…" : "Kích hoạt tài khoản"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          <Link to="/auth/login" className="text-indigo-600 font-medium hover:underline">
            Đã có tài khoản? Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
