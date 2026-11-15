/**
 * Send - ارسال ساده یک متن به چند گیرنده، با GET روی سرویس.
 *
 * این فایل را در app/api/sms/send/route.ts پروژه خودتان بگذارید.
 *
 * کلید در نشانی سرویس می‌نشیند و در لاگ وب‌سرور و هدر Referer می‌ماند. اینجا
 * چون تماس از سرور شما گرفته می‌شود آن لاگ مال خودتان است، ولی برای ارسال
 * عملیاتی باز هم SendBulk بهتر است.
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

  const body = (await request.json()) as { phones?: unknown };
  const phones = normalizeAll(body.phones);

  if (!phones) {
    return Response.json({ error: 'فهرست گیرنده معتبر نیست' }, { status: 400 });
  }

  // متن روی سرور نوشته می‌شود. اگر از بدنه درخواست بیاید، هر کسی که به این
  // روت برسد می‌تواند هر متنی را با خط شما بفرستد.
  const query = new URLSearchParams({
    ApiKey: apiKey,
    Sender: sender,
    Text: 'سفارش شما ثبت شد.',
    Recipients: phones.join(','),
  });

  const answer = await fetch(`https://www.payam-resan.com/api/V3/Send?${query}`, {
    signal: AbortSignal.timeout(30_000),
  });

  const response = (await answer.json()) as Envelope<SentMessage[]>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  return Response.json({ sent: response.Result.map((message) => message.Id) });
}

// سقف سرویس ۹۹ گیرنده است. پیش از رفتن روی شبکه بگیریدش.
function normalizeAll(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 99) {
    return null;
  }

  const phones: string[] = [];

  for (const entry of value) {
    if (typeof entry !== 'string') {
      return null;
    }

    const digits = entry.replace(/\D/g, '').replace(/^0+/, '').replace(/^98/, '');

    if (!/^9\d{9}$/.test(digits)) {
      return null;
    }

    phones.push(digits);
  }

  return phones;
}
// docs:end
