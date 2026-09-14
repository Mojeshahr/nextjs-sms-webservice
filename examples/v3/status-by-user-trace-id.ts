/**
 * StatusByUserTraceId - گزارش تحویل، با شناسه‌ای که خودتان موقع ارسال داده‌اید.
 *
 * این فایل را در app/api/sms/status-by-user-trace-id/route.ts پروژه خودتان بگذارید.
 *
 * وقتی به کار می‌آید که نخواهید Id سامانه را ذخیره کنید. بعد از یک timeout هم
 * همین راه امن پرسیدن است: اگر ارسال ثبت نشده باشد کد ۸ می‌گیرید و می‌توانید
 * بدون ترس از ارسال دوباره، دوباره بفرستید.
 */

// docs:start
import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StatusItem = {
  Id: number;
  UserTraceId: number;
  StatusCode: number;
  Status: string;
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

  if (!apiKey) {
    return Response.json({ error: 'کلید تنظیم نشده است' }, { status: 500 });
  }

  const body = (await request.json()) as { orderIds?: unknown };

  if (!Array.isArray(body.orderIds) || body.orderIds.length === 0) {
    return Response.json({ error: 'فهرست شناسه خالی است' }, { status: 400 });
  }

  const traceIds = await ownedTraceIds(user.id, body.orderIds);

  if (traceIds.length === 0) {
    return Response.json({ error: 'شناسه‌ای متعلق به شما نیست' }, { status: 403 });
  }

  const answer = await fetch(
    'https://api.sms-webservice.com/api/V3/StatusByUserTraceId',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ApiKey: apiKey, UserTraceIds: traceIds }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  const response = (await answer.json()) as Envelope<StatusItem[]>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  return Response.json({
    statuses: response.Result.map((message) => ({
      orderId: message.UserTraceId,
      // کد ۸ یعنی این شناسه در حساب نیست. بعد از یک timeout، همین یعنی ارسال
      // ثبت نشده و می‌شود با خیال راحت دوباره فرستاد.
      status: message.StatusCode === 8 ? 'ثبت نشده' : message.Status,
    })),
  });
}

async function ownedTraceIds(ownerId: string, orderIds: unknown[]): Promise<number[]> {
  void ownerId;
  void orderIds;

  return [];
}
// docs:end
