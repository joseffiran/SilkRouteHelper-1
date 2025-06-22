export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("access_token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    ...options,
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorJson.message || "Request failed";
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    
    throw new Error(errorMessage);
  }

  return response;
}
