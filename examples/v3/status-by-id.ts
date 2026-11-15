/**
 * StatusById - گزارش تحویل، با شناسه‌ای که خود سامانه داده.
 *
 * این فایل را در app/api/sms/status-by-id/route.ts پروژه خودتان بگذارید.
 *
 * شناسه‌ها را از پایگاه داده خودتان بردارید، نه از بدنه درخواست. اگر هر
 * شناسه‌ای را که مرورگر فرستاد جلو ببرید، کاربر می‌تواند وضعیت پیامک‌های
 * بقیه حساب را بخواند.
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

// این پنج کد یعنی پیامک هنوز در راه است. شرط را روی StatusCode بگذارید، نه
// روی متن Status که برای خواندن آدم است و ممکن است عوض شود.
const PENDING = new Set([0, 1, 2, 3, 10]);

export async function POST(request: Request) {
  const user = await requireUser(request);

  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.PAYAM_RESAN_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'کلید تنظیم نشده است' }, { status: 500 });
  }

  const body = (await request.json()) as { messageIds?: unknown };

  if (!Array.isArray(body.messageIds) || body.messageIds.length === 0) {
    return Response.json({ error: 'فهرست شناسه خالی است' }, { status: 400 });
  }

  const ids = await ownedMessageIds(user.id, body.messageIds);

  if (ids.length === 0) {
    return Response.json({ error: 'شناسه‌ای متعلق به شما نیست' }, { status: 403 });
  }

  const answer = await fetch('https://www.payam-resan.com/api/V3/StatusById', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ApiKey: apiKey, Ids: ids }),
    signal: AbortSignal.timeout(30_000),
  });

  const response = (await answer.json()) as Envelope<StatusItem[]>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  return Response.json({
    statuses: response.Result.map((message) => ({
      id: message.Id,
      status: message.Status,
      pending: PENDING.has(message.StatusCode),
    })),
  });
}

// فقط شناسه‌هایی که این کاربر واقعاً فرستاده. بدون این فیلتر، روت شما یک
// پنجره به کل حساب است.
async function ownedMessageIds(ownerId: string, ids: unknown[]): Promise<number[]> {
  void ownerId;
  void ids;

  return [];
}
// docs:end
