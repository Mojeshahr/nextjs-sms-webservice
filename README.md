<div align="center">

<a href="https://payam-resan.com">
  <img src=".github/assets/logo.svg" width="64" height="64" alt="پیام رسان">
</a>

<h1>نمونه‌کدهای Next.js وب‌سرویس پیام رسان</h1>

اتصال به وب‌سرویس <a href="https://payam-resan.com"><b>پنل پیامکی پیام رسان</b></a> با Next.js<br>
یک روت به‌ازای هر متد سرویس، با کلیدی که هیچ‌وقت به مرورگر نمی‌رسد

[![API](https://img.shields.io/badge/API-V3-0a7cbd)](https://payam-resan.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](tsconfig.json)
[![License](https://img.shields.io/badge/license-MIT-6e7781)](LICENSE)

<b>فارسی</b> · <a href="README.en.md">English</a>

</div>

<sub>دنبال زبان دیگری هستید؟ همین نمونه‌ها برای زبان‌های دیگر هم در
[github.com/Mojeshahr](https://github.com/Mojeshahr) هست.</sub>

---

## شروع سریع

این مخزن یک اپ Next.js نیست، مجموعه‌ای از روت‌هندلرهای آماده کپی است. هر فایل
را در پروژه خودتان در مسیر متناظرش بگذارید:

```bash
cp examples/v3/send-token-single.ts ~/my-app/app/api/sms/send-token-single/route.ts
cp lib/session.ts                   ~/my-app/lib/session.ts
```

بعد در `.env.local` پروژه‌تان کلید را بگذارید و مرورگر را به همان روت وصل کنید.
فایل `lib/session.ts` عمداً پیاده‌سازی نشده و باید با بررسی نشست خودتان عوض شود.

با `account-info` شروع کنید: چیزی ارسال نمی‌کند و اعتباری مصرف نمی‌کند.

## پیش از ارسال واقعی

یک سرور آزمایشی هست که مثل سرور عملیاتی جواب می‌دهد ولی پیامکی نمی‌فرستد و
اعتباری مصرف نمی‌کند. کافی است `V3` در نشانی را با `V3SandBox` عوض کنید. تنها
استثنا `TokenList` است که روی آن سرور پیاده نشده.

توجه کنید که سرور آزمایشی یک شبیه‌ساز است، نه آینه حساب شما: اعتبارش همیشه
`1234567` است، خطوطش ساختگی‌اند، و هر کلیدی را می‌پذیرد. پس موفق شدن روی آن
چیزی درباره معتبر بودن کلیدتان نمی‌گوید.

## متدها

<div dir="rtl">

| نمونه | متد | کار |
|---|---|---|
| [account-info.ts](examples/v3/account-info.ts) | `AccountInfo` | اعتبار و خطوط فعال |
| [send.ts](examples/v3/send.ts) | `Send` | ارسال ساده با `GET` |
| [send-bulk.ts](examples/v3/send-bulk.ts) | `SendBulk` | یک متن به چند گیرنده، با شناسه پی‌گیری |
| [send-multiple.ts](examples/v3/send-multiple.ts) | `SendMultiple` | متن جدا برای هر گیرنده |
| [token-list.ts](examples/v3/token-list.ts) | `TokenList` | فهرست قالب‌ها |
| [send-token-single.ts](examples/v3/send-token-single.ts) | `SendTokenSingle` | ارسال قالب به یک شماره |
| [send-token-single-get.ts](examples/v3/send-token-single-get.ts) | `SendTokenSingle` | همان، با `GET` |
| [send-token-single-concat-param.ts](examples/v3/send-token-single-concat-param.ts) | `SendTokenSingleConcatParam` | رمز ساخته‌شده روی سرور در رشته `p` |
| [send-token-single-concat-param-get.ts](examples/v3/send-token-single-concat-param-get.ts) | `SendTokenSingleConcatParam` | همان، با `GET` روی سرویس |
| [send-token-multi.ts](examples/v3/send-token-multi.ts) | `SendTokenMulti` | یک قالب، چند گیرنده |
| [status-by-id.ts](examples/v3/status-by-id.ts) | `StatusById` | وضعیت با شناسه سامانه |
| [status-by-user-trace-id.ts](examples/v3/status-by-user-trace-id.ts) | `StatusByUserTraceId` | وضعیت با شناسه خودتان |
| [get-inbox.ts](examples/v3/get-inbox.ts) | `GetInbox` | پیامک‌های رسیده |

</div>

پنج تابع در این فایل‌ها عمداً خالی‌اند و چیزی برنمی‌گردانند: `lookupOrders` و
`lookupShipments` و `ownedMessageIds` و `ownedTraceIds` و `storeInbox`. جای
کوئری پایگاه داده شمایند و تا پرشان نکنید هیچ پیامکی نمی‌رود. این عمدی است.

## دو تله مخصوص Next.js

بقیه مخزن‌های نمونه یاد می‌دهند چطور سرویس را صدا بزنید. اینجا صدا زدن سرویس
بخش ساده کار است؛ دو تله مخصوص Next.js هست که هر کدام به‌تنهایی حساب شما را
خالی می‌کند.

**پیشوند `NEXT_PUBLIC_` کلید را به مرورگر می‌برد.**
هر متغیر محیطی که نامش با `NEXT_PUBLIC_` شروع شود، Next.js مقدارش را **داخل
باندل جاوااسکریپت مرورگر می‌نویسد**. این قابلیت است، نه اشکال، و برای چیزهایی
مثل نشانی تحلیل‌گر ساخته شده.

اگر کلید را `NEXT_PUBLIC_PAYAM_RESAN_API_KEY` بنامید، در همان اولین build
کلیدتان داخل فایل‌های `.next/static/` می‌نشیند و با `View Source` دیده می‌شود.
هیچ خطایی هم نمی‌گیرید؛ همه‌چیز کار می‌کند تا روزی که صورت‌حساب بیاید.

نام درست همان `PAYAM_RESAN_API_KEY` است، بدون پیشوند. متغیر بدون پیشوند فقط
روی سرور خوانده می‌شود و اگر اشتباهی در یک کامپوننت کلاینتی صدایش بزنید،
`undefined` می‌گیرید نه کلید.

**روت شما یک پروکسی نیست.**
فرض ساده و غلط این است که چون کلید روی سرور است، کار تمام است. ولی روت
`/api/sms/send` نشانی عمومی سایت شماست. هر کسی پیدایش کند می‌تواند صدایش بزند،
و اگر روت هرچه در بدنه آمد را به سرویس جلو ببرد، شما یک دروازه پیامک رایگان
منتشر کرده‌اید. کلید لو نرفته و اعتبارتان هم تمام شده.

نمونه‌های اینجا دو قاعده را رعایت می‌کنند و در کد دیده می‌شوند، نه در کامنت:

**اول اینکه می‌پرسند چه کسی صدا زده.** خط اول هر هندلر `requireUser` است. فایل
[`lib/session.ts`](lib/session.ts) عمداً پیاده‌سازی نشده و در حالت production
استثنا می‌دهد، تا کسی به‌اشتباه با آن منتشر نکند.

**دوم اینکه متن پیام را هرگز از مرورگر نمی‌گیرند.** در هر سیزده هندلر متن روی
سرور نوشته می‌شود. متنی که از بدنه درخواست بیاید یعنی هر کسی می‌تواند هر چیزی
را با خط شما بفرستد.

درباره گیرنده، دو حالت هست و هر دو در نمونه‌ها آمده. در
[`send-bulk.ts`](examples/v3/send-bulk.ts) و
[`send-multiple.ts`](examples/v3/send-multiple.ts) و
[`send-token-multi.ts`](examples/v3/send-token-multi.ts) مرورگر شناسه سفارش
می‌فرستد و سرور از پایگاه داده خودش نگاه می‌کند که آن سفارش مال همین کاربر
است و شماره‌اش چیست.

ولی در [`send-token-single.ts`](examples/v3/send-token-single.ts) شماره ناگزیر
از خود کاربر می‌آید — کسی که تازه ثبت‌نام می‌کند شماره‌اش هنوز در پایگاه داده
شما نیست. آنجا قاعده چیز دیگری است: قالب شماره اعتبارسنجی می‌شود، و **خود کد
روی سرور ساخته می‌شود و هرگز به مرورگر برنمی‌گردد**. اگر کد از بدنه درخواست
بیاید، کاربر کد دلخواهش را می‌فرستد و بعد همان را تأیید می‌کند. سقف نرخ هم
اینجا کار شماست، وگرنه همان روت ابزار فرستادن پیامک به شماره دیگران می‌شود.

## استفاده در پروژه خودتان
هر فایل خودبسنده است و به هیچ چیز این مخزن وابسته نیست جز
[`lib/session.ts`](lib/session.ts). کپی‌کردن فایل در مسیر متناظرش کافی است:

```bash
cp examples/v3/send-bulk.ts ~/my-app/app/api/sms/send-bulk/route.ts
```

اگر پروژه شما مسیر `@/` را تعریف نکرده، فقط خط `import` را به مسیر نسبی
خودتان عوض کنید. بقیه کد دست‌نخورده کار می‌کند.

تایپ `Envelope` هم در هر فایل جداگانه تعریف شده و از جایی import نمی‌شود. اگر
همه متدها را به کار می‌برید، طبیعی است که یک بار در پروژه خودتان تعریفش کنید.

## چند چیز که موقع کار به آن می‌خورید

**کد وضعیت HTTP و فیلد `Success` را هر دو بررسی کنید.** عملیات معمول V3 با `200`
پاسخ می‌دهند؛ عملیات GET و POST متد `SendTokenSingleConcatParam` پاسخ‌های `429` و
`default` هم دارند و ممکن است پاکت معمول را نداشته باشند. موفقیت HTTP به‌تنهایی
موفقیت عملیات را ثابت نمی‌کند؛ وقتی پاکت وجود دارد، فیلد `Success` را بررسی کنید.
پاکت پاسخ در هر هندلر به‌شکل یک union با تمایزدهنده `Success` تایپ شده،
پس اگر بررسی را بردارید کد کامپایل نمی‌شود.

**شماره گیرنده صفر ابتدایی ندارد.** یعنی `9121112222` یا با کد کشور
`989121112222`. تابع `normalize` در نمونه‌ها همین کار را می‌کند، چون کاربر
`0912…` می‌نویسد.

**سقف هر درخواست ۹۹ گیرنده است.** نمونه‌ها پیش از رفتن روی شبکه می‌گیرندش.

**در `SendTokenSingle` فیلد `UserTraceId` همیشه `null` است**، چون آن متد چنین
ورودی‌ای ندارد. اگر شناسه پی‌گیری لازم دارید، `SendTokenMulti` را حتی برای یک
گیرنده هم می‌شود به کار برد.

**هر فراخوانی `GetInbox` کل صندوق را می‌خواند و پیام‌های بازگردانده‌شده را برای
همیشه حذف می‌کند.** یعنی روت `get-inbox`
را به صفحه وصل نکنید: هر بار که کاربری صفحه را باز کند، پیامک‌های
خوانده‌نشده مصرف می‌شوند و دیگر برنمی‌گردند. جای درستش یک کار
زمان‌بندی‌شده است که خروجی را در پایگاه داده خودتان بریزد.

## امنیت کلید
کلید یک راز است. در مخزن کد، در جاوااسکریپت مرورگر و در بسته اپلیکیشن موبایل
نباید قرار بگیرد. جای آن متغیر محیطی روی سرور است.

در Next.js یک راه اضافه برای لو دادنش هست که در بقیه فریم‌ورک‌ها نیست: هر
متغیری که نامش با `NEXT_PUBLIC_` شروع شود داخل باندل مرورگر نوشته می‌شود.
شرحش بالاتر آمده.

اگر کلیدی لو رفت، از پنل یکی تازه بسازید. کلید حذف‌شده برنمی‌گردد.

## ساختار

<div dir="rtl">

| مسیر | چه چیزی دارد |
|---|---|
| `examples/v3/` | یک هندلر مستقل به‌ازای هر عملیات سرویس |
| `lib/session.ts` | جای خالی احراز هویت که در پروژه خودتان پرش می‌کنید |
| `.env.example` | نمونه متغیرهای محیطی |

</div>

عدد `v3` در مسیر عمدی است. نسخه تازه سرویس یعنی پوشه `examples/v<n>/` تازه، و
پوشه موجود دست‌نخورده می‌ماند.

## مستندات و پشتیبانی

راهنمای کامل وب‌سرویس در [docs.payam-resan.com](https://docs.payam-resan.com)
است. توصیف ماشین‌خوان OpenAPI هم در
[sms-webservice-spec](https://github.com/Mojeshahr/sms-webservice-spec).

سؤال یا خطایی هست؟ [issue باز کنید](https://github.com/Mojeshahr/nextjs-sms-webservice/issues)
یا با [پشتیبانی](https://payam-resan.com) تماس بگیرید.

## مجوز

منتشرشده با مجوز MIT. متن کامل در [`LICENSE`](LICENSE).

<br>
<div align="center">
  <sub>
    <img src=".github/assets/logo.svg" width="16" height="16" alt="" align="top">
    &nbsp;<b>پنل پیامکی پیام رسان - موج شهر</b>&nbsp;
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/assets/mojeshahr-dark.svg">
      <img src=".github/assets/mojeshahr-light.svg" width="16" height="16" alt="" align="top">
    </picture>
  </sub>
  <br>
  <sub>
    <a href="https://payam-resan.com">payam-resan.com</a>
    &nbsp;·&nbsp;
    <a href="https://mojeshahr.ir">mojeshahr.ir</a>
  </sub>
</div>
