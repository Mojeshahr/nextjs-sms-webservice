/**
 * SendMultiple - متن متفاوت برای هر گیرنده، در یک درخواست.
 *
 * این فایل را در app/api/sms/send-multiple/route.ts پروژه خودتان بگذارید.
 *
 * وقتی به کار می‌آید که پیام هر نفر با دیگری فرق دارد، مثل نام مشتری در متن.
 * متن همچنان روی سرور ساخته می‌شود؛ چیزی که فرق می‌کند داده است، نه قالب.
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
  const line = process.env.PAYAM_RESAN_SENDER;

  if (!apiKey || !line) {
    return Response.json({ error: 'کلید یا خط تنظیم نشده است' }, { status: 500 });
  }

  const body = (await request.json()) as { orderIds?: unknown };

  if (!Array.isArray(body.orderIds) || body.orderIds.length === 0) {
    return Response.json({ error: 'فهرست سفارش خالی است' }, { status: 400 });
  }

  const orders = await lookupOrders(user.id, body.orderIds);

  if (orders.length === 0 || orders.length > 99) {
    return Response.json({ error: 'سفارشی برای ارسال نیست' }, { status: 400 });
  }

  const sender = Number(line);

  const answer = await fetch('https://www.payam-resan.com/api/V3/SendMultiple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      ApiKey: apiKey,
      Recipients: orders.map((order) => ({
        Sender: sender,
        Destination: Number(order.phone),
        Text: `${order.name}، سفارش شما ارسال شد.`,
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

async function lookupOrders(
  ownerId: string,
  orderIds: unknown[],
): Promise<{ id: number; phone: string; name: string }[]> {
  void ownerId;
  void orderIds;

  return [];
}
// docs:end
