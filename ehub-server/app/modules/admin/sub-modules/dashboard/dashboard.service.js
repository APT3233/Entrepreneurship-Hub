export const createAdminDashboardService = ({ adminDashboardRepository }) => {
  const getDashboard = () => adminDashboardRepository.getDashboardStats();

  return {
    getDashboard,
  };
};
