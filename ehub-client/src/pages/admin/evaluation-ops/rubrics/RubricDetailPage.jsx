import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { rubricService } from "@/api/adminEvaluationOps";
import CriteriaTable from "@/pages/admin/evaluation-ops/components/CriteriaTable";
import PlannedState from "@/pages/admin/evaluation-ops/components/PlannedState";
import RubricBuilder from "@/pages/admin/evaluation-ops/components/RubricBuilder";
import ScorePreview from "@/pages/admin/evaluation-ops/components/ScorePreview";

const tabs = ["Overview", "Criteria", "Usage", "Preview"];

export default function AdminRubricDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [detail, setDetail] = useState({ rubric: null, criteria: [], usage: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    rubricService.get(id)
      .then((res) => setDetail(res?.data || { rubric: null, criteria: [], usage: [] }))
      .catch(() => setDetail({ rubric: null, criteria: [], usage: [] }))
      .finally(() => setLoading(false));
  }, [id]);

  const rubric = detail.rubric || {
    rubric_name: "",
    subject_id: "",
    type: "checkpoint",
    description: "",
    total_score: 10,
    status: "draft",
  };

  if (loading) return <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">Đang tải...</div>;

  return (
    <div className="space-y-4">
      <PlannedState
        title="Rubric API is not implemented yet"
        message="Chi tiết rubric đang ở trạng thái sẵn sàng tích hợp. Khi backend có bảng rubric, tabs Criteria/Usage/Preview có thể nối API thật mà không đổi route."
      />
      <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Overview" ? <RubricBuilder form={rubric} onChange={() => null} planned /> : null}
      {activeTab === "Criteria" ? <CriteriaTable criteria={detail.criteria || []} planned /> : null}
      {activeTab === "Usage" ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
          Chưa có API usage để attach rubric vào checkpoint/assignment.
        </div>
      ) : null}
      {activeTab === "Preview" ? <ScorePreview criteria={detail.criteria || []} totalScore={rubric.total_score} /> : null}
    </div>
  );
}
