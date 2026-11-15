/**
 * AccountInfo - اعتبار باقی‌مانده و خطوط فعال حساب.
 *
 * این فایل را در app/api/sms/account-info/route.ts پروژه خودتان بگذارید.
 *
 * سبک‌ترین متد سرویس و بهترین راه آزمودن کلید: چیزی ارسال نمی‌کند، اعتباری
 * مصرف نمی‌کند، و حتی با اعتبار صفر هم جواب می‌دهد.
 */

// docs:start
import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AccountInfo = {
  Credit: number;
  AvailableSenders: number[];
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

  const answer = await fetch('https://www.payam-resan.com/api/V3/AccountInfo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ApiKey: apiKey }),
    signal: AbortSignal.timeout(30_000),
  });

  const response = (await answer.json()) as Envelope<AccountInfo>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  return Response.json({
    credit: response.Result.Credit,
    senders: response.Result.AvailableSenders,
  });
}
// docs:end
