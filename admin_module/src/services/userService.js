const BASE_URL = "http://localhost:5000/api/admin";

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

// ================= USERS =================

export async function getUsers() {
  const data = await request(`${BASE_URL}/users`);

  return Array.isArray(data)
    ? data
    : data.users || [];
}

export async function addUser(userData) {
  return request(`${BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
}

export async function updateUser(userId, userData) {
  return request(
    `${BASE_URL}/users?user_id=${userId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }
  );
}

export async function deleteUser(userId) {
  return request(
    `${BASE_URL}/users?user_id=${userId}`,
    {
      method: "DELETE",
    }
  );
}

// ================= DEPARTMENTS =================

export async function getDepartments() {
  const data = await request(
    `${BASE_URL}/departments`
  );

  return Array.isArray(data)
    ? data
    : data.departments || [];
}

// ================= ROLES =================

export async function getRoles() {
  const data = await request(`${BASE_URL}/roles`);

  return Array.isArray(data)
    ? data
    : data.roles || [];
}

export async function getUserRoles(userId) {
  const data = await request(
    `${BASE_URL}/user-roles?user_id=${userId}`
  );

  return Array.isArray(data)
    ? data
    : data.roles || [];
}

export async function assignUserRole(userId, roleId) {
  return request(`${BASE_URL}/user-roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      role_id: roleId,
    }),
  });
}

export async function removeUserRole(
  userId,
  roleId
) {
  return request(
    `${BASE_URL}/user-roles?user_id=${userId}&role_id=${roleId}`,
    {
      method: "DELETE",
    }
  );
}

export async function updateUserStatus(userId, status) {
  return request(`${BASE_URL}/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}