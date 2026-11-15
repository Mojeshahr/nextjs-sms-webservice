/**
 * SendTokenMulti - ارسال قالبی به چند گیرنده، هر کدام با پارامترهای خودش.
 *
 * این فایل را در app/api/sms/send-token-multi/route.ts پروژه خودتان بگذارید.
 *
 * برخلاف SendTokenSingle اینجا جای‌گاه‌ها به‌صورت آرایه Parameters می‌آیند و
 * هر گیرنده UserTraceId خودش را می‌گیرد.
 */

// docs:start
import { requireUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TokenSentMessage = {
  Id: number;
  Sender: number;
  FinalText: string;
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

  if (!apiKey) {
    return Response.json({ error: 'کلید تنظیم نشده است' }, { status: 500 });
  }

  const body = (await request.json()) as { shipmentIds?: unknown };

  if (!Array.isArray(body.shipmentIds) || body.shipmentIds.length === 0) {
    return Response.json({ error: 'فهرست مرسوله خالی است' }, { status: 400 });
  }

  const shipments = await lookupShipments(user.id, body.shipmentIds);

  if (shipments.length === 0 || shipments.length > 99) {
    return Response.json({ error: 'مرسوله‌ای برای ارسال نیست' }, { status: 400 });
  }

  // قالب نمونه: «مرسوله شما از {2} تحویل پست شد. بارکد مرسوله پستی: {1}»
  // ترتیب آرایه همان ترتیب شماره جای‌گاه است، نه ترتیب ظاهرش در متن.
  const answer = await fetch('https://www.payam-resan.com/api/V3/SendTokenMulti', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      ApiKey: apiKey,
      TemplateKey: 'postcode',
      Recipients: shipments.map((shipment) => ({
        Destination: Number(shipment.phone),
        UserTraceId: shipment.id,
        Parameters: [shipment.barcode, shipment.city],
      })),
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

  return Response.json({
    sent: response.Result.map((message) => ({
      shipmentId: message.UserTraceId,
      messageId: message.Id,
    })),
  });
}

async function lookupShipments(
  ownerId: string,
  shipmentIds: unknown[],
): Promise<{ id: number; phone: string; barcode: string; city: string }[]> {
  void ownerId;
  void shipmentIds;

  return [];
}
// docs:end
