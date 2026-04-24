import { useState, useRef, useEffect, useCallback, memo } from "react";
import { X, Camera, MapPin, User, Save, Phone } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { fileApi } from "@/api/file";
import DropdownComponent from "@/components/ui/filter/DropDown";

const Dropdown = memo(DropdownComponent);

const CAMPUS_OPTIONS = [
  { label: "Hà Nội", value: "Hà Nội" },
  { label: "Đà Nẵng", value: "Đà Nẵng" },
  { label: "Quy Nhơn", value: "Quy Nhơn" },
  { label: "Cần Thơ", value: "Cần Thơ" },
  { label: "Hồ Chí Minh", value: "Hồ Chí Minh" },
];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const EditProfileModal = memo(({ isOpen, user, onClose, onSave }) => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    campus: "",
    avatar_url: "",
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        campus: user.campus || "",
        avatar_url: user.avatar_url || "",
      });
      setPreviewUrl(user.avatar_url || "");
      setSelectedFile(null);
    }
  }, [user, isOpen]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Ảnh đại diện không được vượt quá 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [toast]);

  const handleCampusChange = useCallback((val) => {
    setFormData(prev => ({ ...prev, campus: val }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    setIsUploading(true);

    try {
      let finalAvatarUrl = formData.avatar_url;

      if (selectedFile) {
        const uploadRes = await fileApi.upload(selectedFile);
        finalAvatarUrl = uploadRes.url;
      }

      await onSave({
        ...formData,
        avatar_url: finalAvatarUrl,
      });
      
      onClose();
    } catch (error) {
      console.error("Update profile failed:", error);
      toast.error(error.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setIsUploading(false);
    }
  }, [formData, selectedFile, onSave, onClose, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4 border-b border-gray-50">
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Chỉnh sửa hồ sơ</h2>
          <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin cá nhân của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-28 h-28 rounded-[32px] overflow-hidden bg-slate-100 border-4 border-white shadow-lg relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={48} />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all border-2 border-white"
              >
                <Camera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tối đa 5MB · Định dạng: JPG, PNG, GIF</p>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Họ và tên
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
                placeholder="Nhập họ và tên"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} /> Số điện thoại
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm font-medium"
                placeholder="Ví dụ: 0912345678"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Cơ sở (Campus)
              </label>
              <Dropdown
                label="Chọn cơ sở..."
                options={CAMPUS_OPTIONS}
                value={formData.campus}
                onChange={handleCampusChange}
              />
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
            disabled={isUploading}
            className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={18} />
            {isUploading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
});

EditProfileModal.displayName = "EditProfileModal";

export default EditProfileModal;
