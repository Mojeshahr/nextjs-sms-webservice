/**
 * SendBulk - یک متن به چند گیرنده، هر کدام با شناسه پی‌گیری خودتان.
 *
 * این فایل را در app/api/sms/send-bulk/route.ts پروژه خودتان بگذارید.
 *
 * روش پیشنهادی برای ارسال عملیاتی. کلید در بدنه می‌رود نه در نشانی، و هر
 * گیرنده UserTraceId خودش را می‌گیرد تا گزارش تحویل را بدون نگه‌داشتن Id
 * سامانه بگیرید. شناسه پی‌گیری را از پایگاه داده خودتان بردارید.
 */

// docs:start
import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SentMessage = {
  Id: number;
  UserTraceId: number;
};

type Envelope<T> =
  | { Success: true; ErrorCode: null; Error: null; Result: T }
  | { Success: false; ErrorCode: number; Error: string; Result: null };

export async function POST(request: Request) {
  const user = await requireUser(request);

  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.PAYAM_RESAN_API_KEY;
  const sender = process.env.PAYAM_RESAN_SENDER;

  if (!apiKey || !sender) {
    return Response.json({ error: 'کلید یا خط تنظیم نشده است' }, { status: 500 });
  }

  const body = (await request.json()) as { orderIds?: unknown };

  if (!Array.isArray(body.orderIds) || body.orderIds.length === 0) {
    return Response.json({ error: 'فهرست سفارش خالی است' }, { status: 400 });
  }

  // گیرنده‌ها از پایگاه داده خودتان می‌آیند، نه از بدنه درخواست. مرورگر
  // شماره نمی‌فرستد، شناسه سفارش می‌فرستد.
  const orders = await lookupOrders(user.id, body.orderIds);

  if (orders.length === 0 || orders.length > 99) {
    return Response.json({ error: 'سفارشی برای ارسال نیست' }, { status: 400 });
  }

  const answer = await fetch('https://api.sms-webservice.com/api/V3/SendBulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      ApiKey: apiKey,
      Sender: Number(sender),
      Text: 'سفارش شما ارسال شد.',
      Recipients: orders.map((order) => ({
        Destination: Number(order.phone),
        UserTraceId: order.id,
      })),
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const response = (await answer.json()) as Envelope<SentMessage[]>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  return Response.json({
    sent: response.Result.map((message) => ({
      orderId: message.UserTraceId,
      messageId: message.Id,
    })),
  });
}

// این را با کوئری واقعی خودتان عوض کنید. شرط ownerId مهم است: بدون آن، کاربر
// می‌تواند شناسه سفارش دیگران را بفرستد.
async function lookupOrders(
  ownerId: string,
  orderIds: unknown[],
): Promise<{ id: number; phone: string }[]> {
  void ownerId;
  void orderIds;

  return [];
}
// docs:end
