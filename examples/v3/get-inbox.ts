/**
 * GetInbox - پیامک‌هایی که به خطوط حساب رسیده‌اند.
 *
 * این فایل را در app/api/sms/get-inbox/route.ts پروژه خودتان بگذارید.
 *
 * هر فراخوانی GetInbox کل صندوق را خالی می‌کند و پیام‌های بازگردانده‌شده
 * برای همیشه حذف می‌شوند؛ فراخوانی بعدی آن‌ها را برنمی‌گرداند. این روت را
 * به مرورگر وصل نکنید؛ جای درستش یک کار زمان‌بندی‌شده است که خروجی را در
 * پایگاه داده خودتان ذخیره کند.
 */

// docs:start
import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type InboxMessage = {
  Id: number;
  Text: string;
  // نام فیلد فرستنده در خود سرویس Form است، نه From. دنبال From نگردید.
  Form: number;
  To: number;
  Time: string;
};

type Envelope<T> =
  | { Success: true; ErrorCode: null; Error: null; Result: T }
  | { Success: false; ErrorCode: number; Error: string; Result: null };

export async function GET(request: Request) {
  const user = await requireUser(request);

  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.PAYAM_RESAN_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'کلید تنظیم نشده است' }, { status: 500 });
  }

  const answer = await fetch('https://www.payam-resan.com/api/V3/GetInbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ApiKey: apiKey }),
    signal: AbortSignal.timeout(30_000),
  });

  const response = (await answer.json()) as Envelope<InboxMessage[]>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  // همین‌جا ذخیره‌شان کنید. فراخوانی بعدی آن‌ها را دوباره برنمی‌گرداند.
  await storeInbox(response.Result);

  return Response.json({ received: response.Result.length });
}

async function storeInbox(messages: InboxMessage[]): Promise<void> {
  void messages;
}
// docs:end
