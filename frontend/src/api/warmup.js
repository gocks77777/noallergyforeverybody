// /api/warmup — HF Spaces 콜드스타트 방지
// Vercel Cron이 5분마다 호출 → HF Spaces에 ping

const HF_SPACES_URL = process.env.HF_SPACES_URL || "https://cleaningsource-allergy-scan-api.hf.space";

export default async function handler(req, res) {
  try {
    const response = await fetch(`${HF_SPACES_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    res.status(200).json({ status: "ok", hf_status: response.status });
  } catch (e) {
    res.status(200).json({ status: "ping_failed", error: e.message });
  }
}
