import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import GroupApi from "@/api/group";
import GroupInfo from "./components/GroupInfo";
import { useToast } from "@/components/ui/Toast";
import { useSelector } from "react-redux";
import { selectHasAnyRole } from "@/store/slices/authSlice";
import { Roles } from "@/constants/roles";

import { BarChart2, Users, CheckSquare } from "lucide-react";

import OverviewTab from "./components/OverviewTab";
import MembersTab from "./components/MembersTab";
import CheckpointTab from "./components/CheckpointTab";
import EditGroupModal from "@/components/modal/lecturer/EditGroupModal";
import CheckpointDetailModal from "@/components/modal/lecturer/CheckpointDetailModal";

const TABS = [
  { key: "overview", label: "Tổng quan", icon: BarChart2 },
  { key: "members", label: "Thành viên", icon: Users },
  { key: "checkpoint", label: "Checkpoint", icon: CheckSquare },
];

/**
 * GroupDetailPage
 * - Fetches group details and members list.
 * - Coordinates sub-components for a consistent detail view into 3 tabs.
 */
export default function GroupDetailPage() {
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const user = useSelector((state) => state.auth.user);
  const isLecturer = useSelector((state) => selectHasAnyRole(state, [Roles.LECTURER, Roles.ADMIN]));
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedCpId, setSelectedCpId] = useState(null);

  // Mock checkpoints — sẽ thay bằng API khi backend hoàn thiện
  const [checkpoints, setCheckpoints] = useState([
    {
      id: 1, name: "Checkpoint 1 – Ý tưởng", title: "Checkpoint 1 – Ý tưởng",
      deadline: "28/02/2026", status: "graded", submittedAt: "27/02/2026",
      score: 8, maxScore: 10,
      feedback: "Nhận xét khoảng 15 đến 20 từ",
      submitters: [],
      files: [
        { id: "f1", file_type: "pdf", file_name: "Bao_cao_y_tuong_du_an.pdf", file_size: 2516582 },
        { id: "f2", file_type: "docx", file_name: "Thiet_ke_giao_dien.docx", file_size: 1887437 },
      ],
    },
    {
      id: 2, name: "Checkpoint 2 – Ý tưởng", title: "Checkpoint 2 – Ý tưởng",
      deadline: "28/02/2026", status: "submitted", submittedAt: "27/02/2026",
      score: null, maxScore: 10, feedback: "",
      submitters: [],
      files: [
        { id: "f3", file_type: "pdf", file_name: "Bao_cao_y_tuong_du_an.pdf", file_size: 2516582 },
        { id: "f4", file_type: "docx", file_name: "Thiet_ke_giao_dien.docx", file_size: 1887437 },
      ],
    },
    {
      id: 3, name: "Checkpoint 3 – Lập trình backend", title: "Checkpoint 3 – Lập trình backend",
      deadline: "05/04/2026", status: "not_submitted",
      files: [], submitters: [],
    },
  ]);

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [groupRes, membersRes] = await Promise.all([
        GroupApi.getById(id),
        GroupApi.getMembers(id)
      ]);

      if (groupRes?.data) {
        console.log("Group detail fetched:", groupRes.data);
        setGroup(groupRes.data);
      } else {
        toast.error("Không tìm thấy thông tin nhóm.");
        navigate("/lecturer/groups");
      }

      if (membersRes?.data) {
        setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
      toast.error("Đã có lỗi xảy ra khi tải thông tin nhóm.");
      // Don't navigate away if it's just a refresh or small error
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async (updatedData) => {
    setIsSaving(true);
    try {
      // API expects group_name, topic, category
      const payload = {
        group_name: updatedData.name,
        topic: updatedData.topic,
        topic_desc: updatedData.topic_desc,
        zalo_link: updatedData.zalo_link,
        category: updatedData.category
      };
      
      const res = await GroupApi.update(id, payload);
      if (res?.data) {
        toast.success("Cập nhật thông tin nhóm thành công!");
        setIsEditModalOpen(false);
        // Refresh local data
        setGroup(prev => ({ ...prev, ...payload }));
      }
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error(error?.message || "Đã có lỗi xảy ra khi cập nhật thông tin.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLeader = !loading && members.some(m => 
    (m.user_id === user?.id || m.id === user?.id) && 
    (m.role === "leader" || m.isLeader || m.is_leader)
  );
  const canEditGroup = isLecturer || isLeader;

  const enrichedCheckpoints = checkpoints.map(cp => ({
    ...cp,
    submitters: members.slice(0, 2),
  }));

  const selectedCp = enrichedCheckpoints.find(c => c.id === selectedCpId) ?? null;

  const handleSaveGrade = async ({ id, score, feedback }) => {
    // Cập nhật mock data (thay bằng API call sau)
    setCheckpoints(prev => prev.map(cp =>
      cp.id === id ? { ...cp, score, feedback, status: "graded" } : cp
    ));
    toast.success("Đã lưu điểm checkpoint!");
    setSelectedCpId(null);
  };

  const handleViewDetail = (cpId) => setSelectedCpId(cpId);

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Top Banner: Main Info Section */}
      {loading || !group ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      ) : (
        <GroupInfo
          name={group.group_name || group.group_code}
          category={group.category || "General"}
          mentor={{
            name: group.mentor_name || "Chưa phân công",
            department: group.mentor_dept || "Khoa Hệ thống Thông tin",
            avatar: group.mentor_avatar
          }}
          classInfo={{
            code: group.class_code || "N/A",
            semester: group.semester_name || group.semester_code || "Kỳ học hiện tại"
          }}
          topic={group.topic || group.description || "Chưa có đề tài"}
          topicDescription={group.topic_desc || "Thông tin chi tiết về đề tài của nhóm sẽ được cập nhật tại đây."}
          zaloLink={group.zalo_link}
          onEdit={() => setIsEditModalOpen(true)}
          canEdit={canEditGroup}
        />
      )}

      {/* Edit Modal */}
      {group && (
        <EditGroupModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateGroup}
          loading={isSaving}
          groupData={{
            name: group.group_name || group.group_code,
            category: group.category,
            topic: group.topic,
            topic_desc: group.topic_desc,
            zalo_link: group.zalo_link
          }}
        />
      )}

      {/* Checkpoint Detail Modal */}
      <CheckpointDetailModal
        isOpen={!!selectedCpId}
        checkpoint={selectedCp}
        onClose={() => setSelectedCpId(null)}
        onSaveGrade={handleSaveGrade}
      />

      {/* Tabs Container */}
      <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
        {/* Tab Header */}
        <div className="flex px-2 md:px-4 pt-4 border-b border-gray-50/50 bg-gray-50/20 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 md:gap-2.5 px-4 md:px-6 py-3.5 md:py-4 text-[10px] md:text-xs font-extrabold transition-all relative uppercase tracking-wider md:tracking-widest whitespace-nowrap shrink-0
                  ${active 
                    ? "text-indigo-600 bg-white rounded-t-2xl shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-t-2xl"}`}
              >
                <Icon size={14} className={active ? "text-indigo-500" : "text-gray-300"} />
                {tab.label}
                {active && (
                   <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="px-8 pb-10 min-h-[400px]">
          {activeTab === "overview" && (
            <OverviewTab
              checkpoints={enrichedCheckpoints}
              members={members}
              loading={loading}
              onViewAllMembers={() => setActiveTab("members")}
              onViewCheckpointDetail={handleViewDetail}
            />
          )}
          {activeTab === "members" && (
            <MembersTab
              members={members}
              loading={loading}
              groupId={id}
              classId={group?.class_id}
              canManageMembers={isLecturer}
              onMembersChanged={fetchData}
            />
          )}
          {activeTab === "checkpoint" && (
            <CheckpointTab
              checkpoints={enrichedCheckpoints}
              loading={loading}
              onViewDetail={handleViewDetail}
            />
          )}
        </div>
      </div>
    </div>
  );
}
