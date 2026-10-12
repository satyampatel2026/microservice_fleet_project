const API_URL = "http://localhost:5000/api/admin/departments";

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Something went wrong"
    );
  }

  return data;
}

export async function getDepartments() {
  const data = await request(API_URL);

  return Array.isArray(data)
    ? data
    : data.departments || [];
}

export async function addDepartment(name) {
  return request(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      department_name: name,
    }),
  });
}

export async function updateDepartment(id, name) {
  return request(
    `${API_URL}?department_id=${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        department_name: name,
      }),
    }
  );
}

export async function deleteDepartment(id) {
  return request(
    `${API_URL}?department_id=${id}`,
    {
      method: "DELETE",
    }
  );
}