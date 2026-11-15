/**
 * SendTokenSingleConcatParam - رمز ساخته‌شده روی سرور در رشته p.
 *
 * این فایل را در app/api/sms/send-token-single-concat-param/route.ts پروژه خودتان بگذارید.
 *
 * مهم‌ترین نمونه این مخزن. خود رمز روی سرور ساخته می‌شود و مرورگر فقط
 * می‌گوید «برای این شماره کد بفرست». اگر رمز را از بدنه درخواست بگیرید،
 * کاربر می‌تواند رمز دلخواهش را بفرستد و بعد همان را تأیید کند.
 */

// docs:start
import { randomInt } from 'node:crypto';

import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TokenSentMessage = {
  Id: number;
  Sender: number;
  FinalText: string | null;
  UserTraceId: number | null;
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

  const body = (await request.json()) as { phone?: unknown };
  const phone = normalize(body.phone);

  if (!phone) {
    return Response.json({ error: 'شماره گیرنده معتبر نیست' }, { status: 400 });
  }

  // رمز اینجا ساخته می‌شود، نه در مرورگر. همین‌جا هم باید ذخیره‌اش کنید تا
  // بعداً بتوانید تأییدش کنید.
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');

  const answer = await fetch('https://www.payam-resan.com/api/V3/SendTokenSingleConcatParam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      ApiKey: apiKey,
      TemplateKey: 'verifycode',
      Destination: Number(phone),
      // این قالب یک جای‌گاه دارد؛ چند مقدار را به ترتیب با ; جدا کنید.
      p: code,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const response = (await answer.json()) as Envelope<TokenSentMessage[]>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  // خود کد هرگز به مرورگر برنمی‌گردد. فقط شناسه پیامک.
  return Response.json({ sent: response.Result.map((message) => message.Id) });
}

// سرویس 9121112222 یا 989121112222 می‌خواهد. کاربر 0912… یا +98912… می‌نویسد.
function normalize(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const digits = value.replace(/\D/g, '').replace(/^0+/, '').replace(/^98/, '');

  return /^9\d{9}$/.test(digits) ? digits : null;
}
// docs:end
