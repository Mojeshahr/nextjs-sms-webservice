/**
 * TokenList - فهرست قالب‌های حساب و وضعیت تأیید هر کدام.
 *
 * این فایل را در app/api/sms/token-list/route.ts پروژه خودتان بگذارید.
 *
 * پیش از اولین ارسال قالبی همین را بگیرید تا کلید قالب و وضعیتش را ببینید.
 * این متد روی سرور آزمایشی پیاده نشده و فقط روی V3 جواب می‌دهد.
 */

// docs:start
import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Template = {
  Key: string;
  TextTemplate: string;
  VoiceTemplate: string | null;
  Status: number;
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

  const answer = await fetch('https://api.sms-webservice.com/api/V3/TokenList', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ ApiKey: apiKey }),
    signal: AbortSignal.timeout(30_000),
  });

  const response = (await answer.json()) as Envelope<Template[]>;

  if (!response.Success) {
    return Response.json(
      { error: response.Error, code: response.ErrorCode },
      { status: 502 },
    );
  }

  return Response.json({
    templates: response.Result.map((template) => ({
      key: template.Key,
      text: template.TextTemplate,
      sendable: template.Status === 2,
    })),
  });
}
// docs:end
