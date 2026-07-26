import instance from "./instance";

const AdminDashboardApi = {
  getDashboard: () => instance.get("/admin/dashboard"),
};

export default AdminDashboardApi;
