import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  getUsers, getDepartments,
  addUser as addUserApi,
  updateUser as updateUserApi,
  deleteUser as deleteUserApi,
  updateUserStatus as updateUserStatusApi,
} from "../services/userService";

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, updateSearch] = useState("");
  const [statusFilter, updateStatus] = useState("all");
  const [departmentFilter, updateDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, updateLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  // Old request late aaye to uska result latest list ko replace na kare.
  const requestNumber = useRef(0);

  const showError = (error) => Swal.fire({
    icon: "error", title: "Unable to load users",
    text: error.message || "Please try again.",
  });

  // Filter change par pehle page se results dikhao.
  const setSearchTerm = (value) => { updateSearch(value); setPage(1); };
  const setStatusFilter = (value) => { updateStatus(value); setPage(1); };
  const setDepartmentFilter = (value) => { updateDepartment(value); setPage(1); };
  const setLimit = (value) => { updateLimit(value); setPage(1); };

  const loadUsers = useCallback(async () => {
    const currentRequest = ++requestNumber.current;
    setLoading(true);
    try {
      const result = await getUsers({
        search: searchTerm, status: statusFilter,
        department: departmentFilter, page, limit,
      });
      if (currentRequest !== requestNumber.current) return;
      setUsers(result.users);
      setPagination(result.pagination);
      setStats(result.stats);
      // Last page empty ho gayi to backend ki corrected page use karo.
      setPage(result.pagination.page);
    } catch (error) {
      if (currentRequest === requestNumber.current) showError(error);
    } finally {
      if (currentRequest === requestNumber.current) setLoading(false);
    }
  }, [searchTerm, statusFilter, departmentFilter, page, limit]);

  useEffect(() => {
    // Typing rukne ke 300ms baad request bhejo.
    setLoading(true);
    const timer = setTimeout(() => { loadUsers(); }, 300);
    return () => {
      clearTimeout(timer);
      requestNumber.current += 1;
    };
  }, [loadUsers]);

  useEffect(() => {
    let cancelled = false;
    getDepartments().then((data) => {
      if (!cancelled) setDepartments(data);
    }).catch((error) => { if (!cancelled) showError(error); });
    return () => { cancelled = true; };
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
      setDepartments(await getDepartments());
    } catch (error) {
      showError(error);
    } finally {
      setRefreshing(false);
    }
  };

  const addUser = async (values) => {
    await addUserApi(values);
    await loadUsers();
  };
  const updateUser = async (userId, values) => {
    await updateUserApi(userId, values);
    await loadUsers();
  };
  const removeUser = async (userId) => {
    await deleteUserApi(userId);
    await loadUsers();
  };
  const changeUserStatus = async (userId, status) => {
    await updateUserStatusApi(userId, status);
    await loadUsers();
  };

  return {
    users, departments, loading, refreshing, pagination, stats,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter,
    departmentFilter, setDepartmentFilter, page, setPage, limit, setLimit,
    loadData, loadUsers, addUser, updateUser, removeUser, changeUserStatus,
  };
}
