import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectAuthUser, setUser } from "@/store/slices/authSlice";
import { 
  User, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  Shield, 
  Calendar, 
  MapPin, 
  Phone,
  Camera,
  Edit2
} from "lucide-react";

import bgFpt from "@/assets/images/background-fpt.jpeg";
import EditProfileModal from "@/components/modal/common/EditProfileModal";
import ChangePasswordModal from "@/components/modal/common/ChangePasswordModal";
import ActivityLogsModal from "@/components/modal/common/ActivityLogsModal";
import { authApi } from "@/api/auth";
import ClassApi from "@/api/class";
import { useToast } from "@/components/ui/Toast";
import { useTranslation } from "@/context/TranslationContext";
import DateTimeCell from "@/components/ui/DateTimeCell";

export default function ProfilePage() {
  const { t, language } = useTranslation();
  const user = useSelector(selectAuthUser);
  const dispatch = useDispatch();
  const toast = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isStudent = roles.includes("student");
  const isLecturer = roles.includes("lecturer");

  const fetchActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    try {
      const res = await authApi.getActivities({ page: 1, limit: 5 });
      setActivities(res.data || []);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoadingActivities(false);
    }
  }, []);
  
  const fetchStats = useCallback(async () => {
    try {
      const res = await ClassApi.getStats();
      setStats(res.data || null);
    } catch (error) {
      console.error("Failed to fetch lecturer stats:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchActivities();
      if (isLecturer) {
        fetchStats();
      }
    }
  }, [fetchActivities, fetchStats, isLecturer, user]);

  const handleSaveProfile = useCallback(async (data) => {
    try {
      const res = await authApi.updateProfile(data);
      dispatch(setUser(res.data));
      toast.success(t("profile.successUpdate"));
      fetchActivities();
    } catch (error) {
      toast.error(error.message || t("profile.failUpdate"));
      throw error;
    }
  }, [dispatch, toast, fetchActivities, t]);

  const handlePasswordChange = useCallback(async (data) => {
    try {
      await authApi.changePassword(data);
      toast.success(t("profile.successPassword"));
      fetchActivities();
    } catch (error) {
      toast.error(error.message || t("profile.failPassword"));
      throw error;
    }
  }, [toast, fetchActivities, t]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
      </div>
    );
  }
  
  const name = user.full_name || user.fullName || user.name || "N/A";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Profile Section */}
      <div className="relative bg-white rounded-[32px] shadow-card">
        {/* Cover Image */}
        <div className="h-48 sm:h-64 relative rounded-t-[32px] overflow-hidden">
          <img 
            src={bgFpt} 
            alt="FPT Background" 
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 80%" }}
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Profile Info Summary */}
        <div className="px-8 pb-8 relative z-10">
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative group z-20 -mt-16 sm:-mt-20">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] border-8 border-white bg-white shadow-xl overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User size={64} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="absolute bottom-2 right-2 p-2 rounded-xl bg-accent-600 text-white shadow-lg hover:bg-accent-700 transition-all border-2 border-white cursor-pointer"
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center sm:text-left mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{name}</h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {roles.map(role => (
                    <span key={role} className="px-3 py-1 rounded-full bg-accent-50 text-accent-600 text-[10px] font-bold uppercase tracking-widest border border-accent-100">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-2 text-sm">
                <Mail size={16} className="text-gray-400" />
                {user.email || t("profile.emailNotUpdated")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield size={18} />
                {t("profile.changePassword")}
              </button>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-accent-600 text-white text-sm font-semibold hover:bg-accent-700 shadow-lg shadow-accent-100 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit2 size={18} />
                {t("profile.editProfile")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-card">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t("profile.title")}</h3>
            <div className="space-y-6">
              {isStudent && (
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("profile.major")}</p>
                    <p className="text-sm font-bold text-gray-700">{user.major || user.student_major || "N/A"}</p>
                  </div>
                </div>
              )}
              {isLecturer && (
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("profile.department")}</p>
                    <p className="text-sm font-bold text-gray-700">{user.department || "N/A"}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {isStudent ? t("profile.studentCode") : t("profile.lecturerCode")}
                  </p>
                  <p className="text-sm font-bold text-gray-700">{user.username || user.memberCode || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("profile.joinDate")}</p>
                  <p className="text-sm font-bold text-gray-700">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString(language === "en" ? "en-US" : "vi-VN", { month: "long", year: "numeric" }) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-card">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t("profile.contact")}</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("profile.phone")}</p>
                  <p className="text-sm font-bold text-gray-700">{user.phone || t("profile.phoneNotUpdated")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("profile.campus")}</p>
                  <p className="text-sm font-bold text-gray-700">{user.campus ? `FPT University, ${user.campus}` : t("common.noData")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats / Bio / Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio / About */}
          <div className="bg-white rounded-[32px] p-8 shadow-card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t("profile.about")}</h3>
            <p className="text-gray-500 leading-relaxed font-medium">
              {user.bio || t("profile.defaultBio")}
            </p>
          </div>

          {/* Activity / Stats Grid */}
          {isLecturer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-accent-600 rounded-[32px] p-8 text-white shadow-xl shadow-accent-100 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <p className="text-accent-100 text-[10px] font-bold uppercase tracking-widest mb-1">{t("profile.managedClasses")}</p>
                <h4 className="text-3xl font-black mb-2">{stats?.classCount || 0}</h4>
                <p className="text-accent-200 text-xs font-medium">{t("profile.managedClassesSub")}</p>
              </div>
              <div className="bg-white rounded-[32px] p-8 shadow-card relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-slate-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{t("profile.managedStudents")}</p>
                <h4 className="text-3xl font-black text-gray-900 mb-2">
                  {stats?.managedStudentCount || 0} / {stats?.totalStudentCount || 0}
                </h4>
                <p className="text-gray-500 text-xs font-medium">{t("profile.managedStudentsSub")}</p>
              </div>
            </div>
          )}

          {/* Recent Activity Placeholder */}
          <div className="bg-white rounded-[32px] p-8 shadow-card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-gray-900">{t("profile.recentActivity")}</h3>
              <button 
                onClick={() => setIsActivityModalOpen(true)}
                className="text-xs font-bold text-accent-600 hover:bg-accent-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {t("profile.viewAll")}
              </button>
            </div>
            <div className="space-y-8">
               {isLoadingActivities ? (
                 <div className="flex flex-col gap-6">
                   {[1, 2].map(i => (
                     <div key={i} className="flex gap-4 animate-pulse">
                       <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0"></div>
                       <div className="flex-1 space-y-2 py-1">
                         <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                         <div className="h-3 bg-gray-50 rounded w-1/4"></div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : activities.length > 0 ? (
                 activities.map((act, idx) => {
                   const entityName = act.title || "";
                   
                    const getActionLabel = (action, title) => {
                      const base = t(`profile.actions.${action}`) || action;
                      return title ? `${base} ${title}` : base;
                    };
                    const actionLabel = getActionLabel(act.action, entityName);

                   return (
                     <div key={act.id} className="flex gap-4 relative group">
                       {idx !== activities.length - 1 && <div className="absolute left-5 top-10 bottom-[-32px] w-0.5 bg-gray-50"></div>}
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-accent-600 group-hover:border-accent-600 transition-all duration-300">
                          <div className="w-2 h-2 rounded-full bg-accent-500 group-hover:bg-white"></div>
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-bold text-gray-800 group-hover:text-accent-600 transition-colors">
                            {actionLabel}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <DateTimeCell
                              value={act.created_at}
                              dateClassName="text-xs font-medium text-gray-500"
                              timeClassName="text-[11px] font-normal text-gray-400"
                            />
                            {act.ip_address && act.action === 'login' && (
                              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-md text-[10px] text-gray-500">
                                IP: {act.ip_address}
                              </span>
                            )}
                          </div>
                       </div>
                     </div>
                   );
                 })
               ) : (
                 <p className="text-sm text-gray-400 italic font-medium">{t("profile.noActivity")}</p>
               )}
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen}
        user={user}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handlePasswordChange}
      />

      <ActivityLogsModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
      />
    </div>
  );
}
