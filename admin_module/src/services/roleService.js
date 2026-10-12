const API_URL = "http://localhost:5000/api/admin/roles";

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

export async function getRoles() {
  const data = await request(API_URL);

  return Array.isArray(data)
    ? data
    : data.roles || [];
}

export async function addRole(roleName) {
  return request(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role_name: roleName,
    }),
  });
}

export async function updateRole(id, roleName) {
  return request(`${API_URL}?role_id=${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role_name: roleName,
    }),
  });
}

export async function deleteRole(id) {
  return request(`${API_URL}?role_id=${id}`, {
    method: "DELETE",
  });
}