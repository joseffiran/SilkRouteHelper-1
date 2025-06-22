export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("access_token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers: headers as HeadersInit,
    ...options,
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const response = await fetch(fullUrl, config);

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
