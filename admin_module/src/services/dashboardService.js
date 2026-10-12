const USERS_API_URL = "http://localhost:5000/api/admin/users/total";
const PARTNERS_API_URL = "http://localhost:5000/api/admin/partners/total";

export async function getDashboardData() {
  const [usersResponse, partnersResponse] = await Promise.all([
    fetch(USERS_API_URL, {
      credentials: "include",
    }),

    fetch(PARTNERS_API_URL, {
      credentials: "include",
    }),
  ]);

  const usersData = await usersResponse.json();
  const partnersData = await partnersResponse.json();

  if (!usersResponse.ok) {
    throw new Error(
      usersData.message || "Users data could not be loaded"
    );
  }

  if (!partnersResponse.ok) {
    throw new Error(
      partnersData.message || "Partners data could not be loaded"
    );
  }

  return {
    users: Number(usersData[0]?.total_users || 0),
    partners: Number(partnersData.data?.total_partners || 0),

    // Future APIs
    vehicles: 0,
    drivers: 0,
    workshops: 0,
  };
}
