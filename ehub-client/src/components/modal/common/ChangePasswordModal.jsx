import { useState, useCallback, memo } from "react";
import { X, Lock, Eye, EyeOff, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const ChangePasswordModal = memo(({ isOpen, onClose, onSave }) => {
  const toast = useToast();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (formData.new_password.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        old_password: formData.old_password,
        new_password: formData.new_password,
      });
      setFormData({ old_password: "", new_password: "", confirm_password: "" });
      onClose();
    } catch (error) {
      // Error handled by caller toast or passed here
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSave, onClose, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 border-b border-gray-50">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Đổi mật khẩu</h2>
          <p className="text-sm text-gray-500 mt-1">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* Old Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                value={formData.old_password}
                onChange={(e) => setFormData(prev => ({ ...prev, old_password: e.target.value }))}
                className="w-full px-4 py-2.5 pr-12 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
                placeholder="Nhập mật khẩu cũ"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-50 w-full"></div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={formData.new_password}
                onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                className="w-full px-4 py-2.5 pr-12 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
                placeholder="Tối thiểu 6 ký tự"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirm_password}
                onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                className="w-full px-4 py-2.5 pr-12 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
                placeholder="Nhập lại mật khẩu mới"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isSubmitting ? "Đang xử lý..." : "Cập nhật"}
          </button>
        </div>
      </div>
    </div>
  );
});

ChangePasswordModal.displayName = "ChangePasswordModal";

export default ChangePasswordModal;
