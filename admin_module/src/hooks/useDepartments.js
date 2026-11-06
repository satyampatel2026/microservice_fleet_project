import {
  useCallback,
  useEffect,
  useState,
} from "react";
import useDepartmentStore from "../store/departmentStore";
import {
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/departmentService";

export default function useDepartments() {
  const departments=useDepartmentStore((state)=>state.departments);
  const setDepartments=useDepartmentStore((state)=>state.setDepartments);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const loadDepartments = useCallback(
    async (refresh = false) => {
      try {
        refresh
          ? setRefreshing(true)
          : setLoading(true);

        const data = await getDepartments();

        setDepartments(data);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setDepartments]
  );

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  async function createDepartment(name) {
    await addDepartment(name);
    await loadDepartments();
  }

  async function editDepartment(id, name) {
    await updateDepartment(id, name);
    await loadDepartments();
  }

  async function removeDepartment(id) {
    await deleteDepartment(id);
    await loadDepartments();
  }

  return {
    departments,
    loading,
    refreshing,

    loadDepartments,

    createDepartment,
    editDepartment,
    removeDepartment,
  };
}