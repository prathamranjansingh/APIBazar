const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";


// Fetch API details
export async function fetchApiDetails(id, token) {
  const response = await fetch(`${API_BASE_URL}/apis/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch API details");
  }
  return response.json();
}

// Update API
export async function updateApi(id, data, token) {
  const response = await fetch(`${API_BASE_URL}/apis/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update API");
  }
  return response.json();
}

// Delete API
export async function deleteApi(id, token) {
  const response = await fetch(`${API_BASE_URL}/apis/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete API");
  }
  return response.json();
}

// Endpoint service functions
export async function createEndpoint(apiId, data, token) {
  const response = await fetch(`${API_BASE_URL}/apis/${apiId}/endpoints`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create endpoint");
  }
  return response.json();
}