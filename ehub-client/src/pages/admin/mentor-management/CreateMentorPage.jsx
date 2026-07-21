import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

/** Mentor login accounts are created via Access Control → Users (role mentor). */
export default function CreateMentorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/users?page=1&create=mentor", { replace: true });
  }, [navigate]);

  return <Navigate to="/admin/users?page=1&create=mentor" replace />;
}
