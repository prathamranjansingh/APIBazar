const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// Purchase an API
export async function purchaseApi(apiId, token) {
  const response = await fetch(`${API_BASE_URL}/apis/${apiId}/purchase`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to purchase API");
  }
  return response.json();
}