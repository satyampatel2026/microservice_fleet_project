import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import {getUsers,getDepartments,
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

  const showError = (title, error) => {
    Swal.fire({
      icon: "error",
      title,
      text:
        error.message ||
        "Something went wrong",
      confirmButtonColor: "#4f46e5",
    });
  };

  const loadUsers = useCallback(async () => {
    const data = await getUsers();
    setUsers(data);
  }, []);

  const loadDepartments = useCallback(async () => {
    const data = await getDepartments();
    setDepartments(data);
  }, []);

  const loadData = useCallback(
    async (refresh = false) => {
      try {
        refresh
          ? setRefreshing(true)
          : setLoading(true);

        const [userData, departmentData] = await Promise.all([getUsers(),getDepartments(),]);

        setUsers(userData);
        setDepartments(departmentData);
      } catch (error) {
        showError(
          "Unable to load users",
          error
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    users,
    departments,
    loading,
    refreshing,

    loadData,
    loadUsers,

    addUser,
    updateUser,
    removeUser,
    changeUserStatus,
  };
}