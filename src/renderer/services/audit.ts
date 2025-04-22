import { GET, POST } from ".";

export async function fetchAuditTokens(API: string): Promise<any> {
  const serverResponse = await POST(`${API}/audit/list/token`);
  return serverResponse.data;
}
