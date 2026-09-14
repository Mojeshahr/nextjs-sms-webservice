/**
 * SendTokenSingle - همان ارسال قالبی، این بار با GET روی سرویس.
 *
 * این فایل را در app/api/sms/send-token-single-get/route.ts پروژه خودتان بگذارید.
 *
 * فقط وقتی به کار می‌آید که ابزارتان جز GET چیزی ندارد. کلید در نشانی سرویس
 * می‌رود و در لاگ وب‌سرور و هدر Referer می‌ماند. اگر انتخاب دارید، واریانت
 * POST را بردارید.
 */

// docs:start
import { randomInt } from 'node:crypto';

import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TokenSentMessage = {
  Id: number;
  Sender: number;
  FinalText: string;
  UserTraceId: null;
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

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');

  const query = new URLSearchParams({
    ApiKey: apiKey,
    TemplateKey: 'verifycode',
    Destination: phone,
    p1: code,
  });

  const answer = await fetch(
    `https://api.sms-webservice.com/api/V3/SendTokenSingle?${query}`,
    { signal: AbortSignal.timeout(30_000) },
  );

  const response = (await answer.json()) as Envelope<TokenSentMessage[]>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  return Response.json({ sent: response.Result.map((message) => message.Id) });
}

function normalize(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const digits = value.replace(/\D/g, '').replace(/^0+/, '').replace(/^98/, '');

  return /^9\d{9}$/.test(digits) ? digits : null;
}
// docs:end
