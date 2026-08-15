/**
 * @file Call seed transcripts
 * @description English and Persian recorded-call copy for seed data.
 */

import { daysAgo, hoursAgo } from "@/lib/utils/time";
import type { CallRecording } from "@/types";

export type CallDraft = Omit<CallRecording, "id" | "customerId" | "agentId">;

export const EN_CALLS: CallDraft[] = [
  {
    direction: "inbound",
    status: "completed",
    subject: "Annual renewal and SSO",
    startedAt: hoursAgo(5),
    durationSec: 312,
    recordingUrl: "seed://call-1",
    transcript:
      "Agent: Hi Maya, thanks for calling Kerso — this is Arya.\nCustomer: Hi Arya. We want to lock the annual renewal this week.\nAgent: Great. Finance is the same contact from last week, right?\nCustomer: Yes. We also need SSO before the rollout.\nAgent: I will send the SSO checklist today and a draft contract tomorrow.\nCustomer: Perfect. Let’s schedule a follow-up Friday.",
    summary: null,
  },
  {
    direction: "outbound",
    status: "completed",
    subject: "Onboarding check-in",
    startedAt: daysAgo(1),
    durationSec: 248,
    recordingUrl: "seed://call-2",
    transcript:
      "Agent: Checking in on onboarding — how is the team finding the inbox?\nCustomer: Inbox is great. We need help mapping old tags.\nAgent: I will send a tag-mapping template this afternoon.\nCustomer: Also, can we schedule a training workshop next week?\nAgent: Yes. I’ll put a 45-minute session on Tuesday.",
    summary: null,
  },
  {
    direction: "inbound",
    status: "completed",
    subject: "Billing question",
    startedAt: daysAgo(2),
    durationSec: 186,
    recordingUrl: "seed://call-3",
    transcript:
      "Customer: The last invoice looks higher than we expected.\nAgent: Let me check — you added twelve seats mid-cycle.\nCustomer: Ah, that explains it. Can you send a seat breakdown?\nAgent: I will email the invoice line items today.\nCustomer: Thanks. We agree to keep the extra seats.",
    summary: null,
  },
  {
    direction: "outbound",
    status: "completed",
    subject: "Demo follow-up",
    startedAt: daysAgo(3),
    durationSec: 421,
    recordingUrl: "seed://call-4",
    transcript:
      "Agent: Following up on yesterday’s demo. Any questions from the team?\nCustomer: Leadership liked analytics. They need a security add-on quote.\nAgent: I will send pricing for the security add-on and a 30-day pilot.\nCustomer: If the price is close, we will sign this month.\nAgent: I’ll include a next-step checklist in the email.",
    summary: null,
  },
  {
    direction: "inbound",
    status: "voicemail",
    subject: "Voicemail — API access",
    startedAt: daysAgo(4),
    durationSec: 42,
    recordingUrl: "seed://call-5",
    transcript:
      "Customer: Hi, leaving a voicemail. We need API access for the data migration this week. Please call back.",
    summary: null,
  },
  {
    direction: "outbound",
    status: "missed",
    subject: "Missed — QBR reminder",
    startedAt: daysAgo(5),
    durationSec: 0,
    recordingUrl: "seed://call-6",
    transcript: "",
    summary: null,
  },
  {
    direction: "inbound",
    status: "completed",
    subject: "Support escalation",
    startedAt: daysAgo(6),
    durationSec: 540,
    recordingUrl: "seed://call-7",
    transcript:
      "Customer: Calendar sync keeps dropping events. This is blocking the team.\nAgent: I’m sorry — I’ll escalate this as high priority.\nCustomer: We need a fix before Friday’s board meeting.\nAgent: I will open a ticket and schedule an engineer call tomorrow.\nCustomer: Please send a status update by Thursday.",
    summary: null,
  },
  {
    direction: "outbound",
    status: "completed",
    subject: "Expansion conversation",
    startedAt: daysAgo(8),
    durationSec: 365,
    recordingUrl: "seed://call-8",
    transcript:
      "Agent: You mentioned extra seats for the success team.\nCustomer: Yes — we need twenty more seats next quarter.\nAgent: I can add a volume discount if you renew annually.\nCustomer: Send the quote and we will review with finance.\nAgent: I’ll follow up with the contract addendum this week.",
    summary: null,
  },
];

export const FA_CALLS: CallDraft[] = [
  {
    direction: "inbound",
    status: "completed",
    subject: "تمدید سالانه و SSO",
    startedAt: hoursAgo(5),
    durationSec: 312,
    recordingUrl: "seed://call-1",
    transcript:
      "کارشناس: سلام نگار، با کرسو تماس گرفتید — آرش هستم.\nمشتری: سلام آرش. می‌خواهیم تمدید سالانه را همین هفته قطعی کنیم.\nکارشناس: عالی. تصمیم‌گیرنده مالی همان تماس هفتهٔ پیش است؟\nمشتری: بله. قبل از راه‌اندازی به SSO هم نیاز داریم.\nکارشناس: چک‌لیست SSO را امروز و پیش‌نویس قرارداد را فردا ارسال می‌کنم.\nمشتری: عالی. پیگیری را جمعه زمان‌بندی کنیم.",
    summary: null,
  },
  {
    direction: "outbound",
    status: "completed",
    subject: "پیگیری راه‌اندازی",
    startedAt: daysAgo(1),
    durationSec: 248,
    recordingUrl: "seed://call-2",
    transcript:
      "کارشناس: برای راه‌اندازی تماس گرفتم — صندوق ورودی چطور است؟\nمشتری: صندوق عالی است. برای نگاشت تگ‌های قدیمی نیاز به کمک داریم.\nکارشناس: قالب نگاشت تگ را امروز بعدازظهر ارسال می‌کنم.\nمشتری: می‌توانیم هفتهٔ بعد یک کارگاه آموزشی هم بگذاریم؟\nکارشناس: بله. جلسهٔ ۴۵ دقیقه‌ای سه‌شنبه را زمان‌بندی می‌کنم.",
    summary: null,
  },
  {
    direction: "inbound",
    status: "completed",
    subject: "سؤال صورتحساب",
    startedAt: daysAgo(2),
    durationSec: 186,
    recordingUrl: "seed://call-3",
    transcript:
      "مشتری: فاکتور قبلی از انتظارمان بالاتر است.\nکارشناس: بررسی می‌کنم — دوازده صندلی وسط دوره اضافه کردید.\nمشتری: متوجه شدم. می‌توانید جزئیات صندلی‌ها را بفرستید؟\nکارشناس: اقلام فاکتور را امروز ایمیل می‌کنم.\nمشتری: ممنون. با صندلی‌های اضافه موافقیم.",
    summary: null,
  },
  {
    direction: "outbound",
    status: "completed",
    subject: "پیگیری دمو",
    startedAt: daysAgo(3),
    durationSec: 421,
    recordingUrl: "seed://call-4",
    transcript:
      "کارشناس: بعد از دموی دیروز پیگیری می‌کنم. سؤالی بود؟\nمشتری: مدیران تحلیل را پسندیدند. قیمت افزونهٔ امنیت را نیاز داریم.\nکارشناس: قیمت افزونه و پایلوت ۳۰ روزه را ارسال می‌کنم.\nمشتری: اگر قیمت نزدیک باشد همین ماه قرارداد می‌بندیم.\nکارشناس: چک‌لیست گام بعدی را هم در ایمیل می‌گذارم.",
    summary: null,
  },
  {
    direction: "inbound",
    status: "voicemail",
    subject: "پیام صوتی — دسترسی API",
    startedAt: daysAgo(4),
    durationSec: 42,
    recordingUrl: "seed://call-5",
    transcript:
      "مشتری: سلام، پیام می‌گذارم. برای مهاجرت داده این هفته به دسترسی API نیاز داریم. لطفاً تماس بگیرید.",
    summary: null,
  },
  {
    direction: "outbound",
    status: "missed",
    subject: "بی‌پاسخ — یادآوری جلسهٔ فصلی",
    startedAt: daysAgo(5),
    durationSec: 0,
    recordingUrl: "seed://call-6",
    transcript: "",
    summary: null,
  },
  {
    direction: "inbound",
    status: "completed",
    subject: "ارجاع پشتیبانی",
    startedAt: daysAgo(6),
    durationSec: 540,
    recordingUrl: "seed://call-7",
    transcript:
      "مشتری: همگام‌سازی تقویم رویدادها را از دست می‌دهد. کار تیم قفل شده.\nکارشناس: متأسفم — این را با اولویت بالا ارجاع می‌دهم.\nمشتری: قبل از جلسهٔ هیئت در جمعه نیاز به رفع داریم.\nکارشناس: تیکت باز می‌کنم و تماس مهندس را فردا زمان‌بندی می‌کنم.\nمشتری: لطفاً تا پنجشنبه وضعیت را ارسال کنید.",
    summary: null,
  },
  {
    direction: "outbound",
    status: "completed",
    subject: "گفتگوی توسعه",
    startedAt: daysAgo(8),
    durationSec: 365,
    recordingUrl: "seed://call-8",
    transcript:
      "کارشناس: گفتید تیم موفقیت به صندلی بیشتر نیاز دارد.\nمشتری: بله — فصل بعد بیست صندلی دیگر نیاز داریم.\nکارشناس: اگر تمدید سالانه باشد تخفیف حجمی می‌دهم.\nمشتری: پیش‌فاکتور را بفرستید تا با مالی بررسی کنیم.\nکارشناس: الحاقیهٔ قرارداد را همین هفته پیگیری می‌کنم.",
    summary: null,
  },
];
