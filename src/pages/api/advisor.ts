import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { fetchDesigns } from '../../lib/sheets';

export const prerender = false;

interface RequestBody {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as RequestBody;
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch designs for the AI context
    let designsJson = '[]';
    try {
      const designs = await fetchDesigns();
      const summary = designs.map(d => ({
        ma_mau: d.ma_mau,
        ten: d.ten,
        loai: d.loai,
        dien_tich_dat: d.dien_tich_dat,
        so_tang: d.so_tang,
        so_phong_ngu: d.so_phong_ngu,
        phong_cach: d.phong_cach,
        huong: d.huong,
        chi_phi_xay_du_kien: d.chi_phi_xay_du_kien,
        gia_ban_ho_so: d.gia_ban_ho_so,
        mo_ta: d.mo_ta.substring(0, 200), // truncate to save tokens
      }));
      designsJson = JSON.stringify(summary, null, 2);
    } catch {
      console.error('[advisor] Failed to fetch designs for AI context');
    }

    const systemPrompt = `Bạn là AI tư vấn thiết kế nhà của "Nhà Đẹp Thiết Kế". Nhiệm vụ của bạn là giúp khách hàng tìm mẫu thiết kế phù hợp nhất với nhu cầu của họ.

Danh sách mẫu thiết kế hiện có:
${designsJson}

Hướng dẫn:
- Chỉ tư vấn dựa trên danh sách mẫu thiết kế thực tế ở trên. Không bịa đặt thông tin.
- Nếu không có mẫu phù hợp, hãy thành thật nói và đề xuất mẫu gần nhất.
- Giới thiệu cụ thể mã mẫu (ma_mau), tên mẫu, và lý do phù hợp với nhu cầu khách hàng.
- Hỏi về nhu cầu của khách hàng: loại nhà, diện tích đất, số tầng, số phòng ngủ, phong cách, hướng nhà, ngân sách.
- Trả lời ngắn gọn, thân thiện bằng tiếng Việt.
- Định dạng giá tiền theo VND (ví dụ: 4.500.000 đồng).
- Cuối mỗi câu trả lời có mẫu gợi ý, hãy hướng dẫn khách hàng vào trang chi tiết để xem thêm.`;

    const client = new Anthropic({ apiKey });

    // Build message history (max 10 exchanges = 20 messages)
    const messages: Anthropic.MessageParam[] = [];
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: 'user', content: message });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[advisor] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Dịch vụ tư vấn tạm thời gián đoạn. Vui lòng thử lại.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
