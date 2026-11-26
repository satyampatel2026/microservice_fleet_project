import { useCallback, useEffect, useState,} from "react";
import Swal from "sweetalert2";
import { getDashboardData,} from "../services/dashboardService";
import { getPendingServiceRequests } from "../services/serviceRequestService";

const initialData = {
  users: 0,
  partners: 0,
  vehicles: 0,
  drivers: 0,
  workshops: 0,
  totalRequests: null,
completedRequests: null,
};

export default function useDashboard() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(
    async (refresh = false) => {
      try {
        refresh
          ? setRefreshing(true)
          : setLoading(true);

        const result = await getDashboardData();
        setData(result);
        const [allRequests, completedRequests] = await Promise.all([
  getPendingServiceRequests({ status: "all", limit: 1 }),
  getPendingServiceRequests({ status: "completed", limit: 1 }),
]);

setData({
  ...result,
  totalRequests: allRequests.pagination.total,
  completedRequests: completedRequests.pagination.total,
});
        setLastUpdated(new Date());

        if (refresh) {
          Swal.fire({
            icon: "success",
            title: "Dashboard refreshed",
            timer: 1200,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title:
            "Dashboard data not loaded",
          text:
            error.message ||
            "Please check backend server.",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    ...data,
    loading,
    refreshing,
    lastUpdated,
    loadDashboard,
  };
}