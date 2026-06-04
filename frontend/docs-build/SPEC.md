# SafetyOS — Detailed Document Build Spec

You are generating **printable, single-file HTML safety documents** in **Hebrew (RTL)** for an Israeli safety-management app. Each document must be **genuinely detailed and specific to its subject** — NOT a shared template with swapped titles. Two documents must never share the same body text.

Write each file to: `frontend/public/docs/<filename>` (paths are given per doc below).

## Hard rules
- Hebrew, `dir="rtl"`, real professional safety content grounded in Israeli regulation (פקודת הבטיחות בעבודה, תקנות הבטיחות בעבודה, ת"י תקנים, הוראות מינהל הבטיחות, משרד העבודה).
- Each doc is **distinct**: different purpose text, different procedure steps, different checklist rows, different common-failures. Do NOT copy paragraphs between docs.
- No external assets, no JS frameworks — one self-contained `.html` file with inline `<style>` and the print button only.
- Keep each doc roughly 90–150 lines. Substance over padding.

## Required structure (every doc)
```html
<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{TITLE}</title><style>{CSS}</style></head>
<body><div class="page">
  <div class="header"><div><h1>{ICON} {TITLE}</h1><p>{english subtitle}</p></div><div style="font-size:36px">{ICON}</div></div>
  <div class="body">
    <div class="sec"><div class="sec-title">🎯 מטרה ותחולה</div> <p>...specific...</p></div>
    <div class="sec"><div class="sec-title">⚖️ בסיס חוקי ותקינה</div> <ul>...specific regs/standards...</ul></div>
    <div class="sec"><div class="sec-title">📋 שלבי ביצוע מפורטים</div> <ol>...detailed ordered steps unique to this subject...</ol></div>
    <div class="sec"><div class="sec-title">👥 תפקידים ואחריות</div> <ul>...roles...</ul></div>
    <div class="sec"><div class="sec-title">🦺 ציוד ואמצעים נדרשים</div> <ul>...equipment...</ul></div>
    <div class="sec"><div class="sec-title">☑️ צ'קליסט אימות</div> <div class="checklist"> repeated <label class="check-row"><input type="checkbox"> ...specific item...</label> </div></div>
    <div class="sec"><div class="sec-title">⛔ כשלים נפוצים</div> <div class="warn">...</div> (2–4 warns)</div>
    <div class="sec"><div class="sec-title">✍️ אישור וחתימות</div>
      <div class="sig-grid">
        <div class="sig-box"><div class="sig-label">ממונה בטיחות</div><div class="sig-line"></div><div class="sig-name">שם / תאריך / חתימה</div></div>
        <div class="sig-box"><div class="sig-label">מנהל עבודה</div><div class="sig-line"></div><div class="sig-name">שם / תאריך / חתימה</div></div>
      </div>
    </div>
  </div>
</div><br><button class="print-btn" onclick="window.print()">🖨️ הדפס</button></body></html>
```

## CSS (paste verbatim; replace every `COLOR` with the doc's hex theme color)
```css
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;color:#1a1a1a;direction:rtl;line-height:1.6}.page{max-width:820px;margin:20px auto;background:#fff;border:2px solid COLOR;border-radius:8px;overflow:hidden}.header{background:COLOR;color:#fff;padding:20px 26px;display:flex;justify-content:space-between;align-items:center}.header h1{font-size:20px;font-weight:bold}.header p{font-size:12px;opacity:.85;margin-top:4px}.body{padding:22px 26px}.sec{margin-bottom:20px}.sec-title{font-size:14px;font-weight:bold;color:COLOR;border-bottom:2px solid COLOR;padding-bottom:5px;margin-bottom:10px}.sec p,.sec li{font-size:13px;color:#333}.sec ul,.sec ol{padding-right:20px;margin-top:6px}.sec li{margin-bottom:5px}.checklist{border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-top:6px}.check-row{display:flex;align-items:flex-start;gap:10px;padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:13px}.check-row:last-child{border-bottom:none}.check-row:nth-child(even){background:#fafafa}.check-row input{width:16px;height:16px;flex-shrink:0;margin-top:2px}.warn{background:#fef2f2;border-right:3px solid #dc2626;padding:8px 12px;border-radius:4px;font-size:12.5px;margin-bottom:6px;color:#7f1d1d}.note{background:#fffbeb;border-right:3px solid #d97706;padding:8px 12px;border-radius:4px;font-size:12.5px;color:#78350f}.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:4px}.sig-box{border:1px solid #bbb;border-radius:6px;padding:12px;text-align:center}.sig-label{font-size:11px;font-weight:bold;color:#555;margin-bottom:6px}.sig-line{border-bottom:1px solid #999;height:38px;margin-bottom:6px}.sig-name{font-size:10px;color:#777}.print-btn{display:block;margin:0 auto 20px;padding:10px 32px;background:COLOR;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:bold;cursor:pointer}@media print{body{background:#fff}.page{border:none;margin:0;border-radius:0}.print-btn{display:none}}
```

---
# DOC MANIFEST

Each row: `filename | TITLE | ICON | COLOR | context to cover`.
For procedure docs, the "context" lists the sub-topics (categories) — write detailed, distinct content covering all of them for that specific subject.

## GROUP P1 — work + construction
- `proc-work-ppe.html` | ציוד מגן אישי ובטיחות אישית | 🦺 | #1e3a5f | בחירת והנפקת ציוד מגן אישי (קסדה, נעלי בטיחות, אפוד, מגן עיניים/פנים), התאמה לסיכון, בדיקה תקופתית, הדרכה.
- `proc-work-height-tools.html` | עבודה בגובה וכלי עבודה | 🪜 | #1e3a5f | אבטחת פיגומים, רתמות ונקודות עיגון, תקינות כלי עבודה ומכשירים, אחסון בטוח.
- `proc-work-housekeeping.html` | סדר, חומרים מסוכנים ואש וחירום | 🧹 | #1e3a5f | מסלולי מעבר פנויים, סדר וניקיון, אחסון חומ"ס מסומן, מטפי כיבוי ותאורת חירום.
- `proc-construction-scaffold-height.html` | פיגומים, עבודה בגובה וגידור | 🧱 | #7b4f12 | גידור פריפריאלי, רשתות בטיחות, הקמת פיגום מוסמך, מעקות, רתמות מעל 2 מ׳, גידור פתחים.
- `proc-construction-mechanical-dig.html` | ציוד מכני וחפירות | ⛏️ | #7b4f12 | עגורן/מנוף תעודת כושר, אופרטור מוסמך, חפירות מעל 1.5 מ׳ תמיכת דפנות, גידור חפירות.
- `proc-construction-electrical-ppe.html` | חשמל, ציוד מגן וסדר | ⚡ | #7b4f12 | לוח חשמל זמני מוגן ומאורק, כבלים מוגנים, קסדה/נעליים/אפוד, פינוי פסולת בנייה.

## GROUP P2 — infrastructure + industrial
- `proc-infrastructure-excavation-util.html` | חפירות, חשיפה וצינורות תת-קרקעיים | ⛏️ | #5b4e9e | גידור ותמרור חפירות, תאורת לילה ומחזירי אור, תמיכת דפנות, תיאום וסימון קווי תשתית.
- `proc-infrastructure-traffic-mgmt.html` | בטיחות תנועה והסדרי תנועה | 🚦 | #5b4e9e | תמרורי אזהרה ומסלול עוקף, אפוד זוהר ושוטר/מכוון בכביש.
- `proc-infrastructure-equip-power-comm.html` | ציוד מכני, חשמל ותקשורת | 🔌 | #5b4e9e | בדיקה יומית לציוד כבד, הארקת גנרטורים ומרחק מחומרים דליקים, ציוד מגן, נוהל תקשורת חירום.
- `proc-industrial-machine-loto.html` | מיגון מכונות ונוהל LOTO | 🏭 | #1a5276 | מגן קבוע למכונות, נוהל Lockout/Tagout בתחזוקה, כפתורי עצירת חירום E-Stop נגישים ובדוקים.
- `proc-industrial-hazmat-health.html` | חומרים מסוכנים וגהות תעסוקתית | ☣️ | #1a5276 | גיליונות SDS, אחסון דליקים בארון מוגן אש, ציוד שפכים, אוורור, בדיקת רעש ופקקי אוזניים.
- `proc-industrial-ppe-fire-train.html` | ציוד מגן, אש והכשרה | 🔥 | #1a5276 | PPE לפי סיכון בעמדה, ספרינקלרים/גלאי עשן לא חסומים, נתיבי פינוי, הדרכת עמדה ותרגיל פינוי.

## GROUP P3 — fire + electrical
- `proc-fire-extinguishing.html` | ציוד כיבוי וגלאים | 🧯 | #b03a2e | מטפים בתוקף ונגישים, ארונות כיבוי (הידרנט), ספרינקלרים ללא חסימה, גלאי עשן/חום פעילים, מערכת אזעקה רבעונית.
- `proc-fire-emergency-exits.html` | מוצאי חירום ודלתות אש | 🚪 | #b03a2e | שילוט יציאה מואר, דלתות חירום נפתחות מבפנים, מסלולי פינוי פנויים, דלתות אש נסגרות אוטומטית.
- `proc-fire-fire-maintenance.html` | תחזוקה ומניעת אש | 🔥 | #b03a2e | תרגיל פינוי שנתי, איסור אחסון דליקים ליד מקורות חום, חדרי חשמל/ממ"ד נקיים מפסולת דליקה.
- `proc-electrical-loto.html` | נוהל LOTO וניתוק אנרגיה | ⚡ | #b7950b | ניתוק ונעילת אנרגיה, אימות העדר מתח, רק חשמלאי מוסמך, נעילה לפני/אחרי תחזוקה.
- `proc-electrical-panels-ground.html` | לוחות חשמל והארקה | 🔌 | #b7950b | לוחות סגורים ומסומנים, מפסקי פחת RCD/GFCI, איסור חיבורים זמניים, הארקה תקינה ומוט הארקה ראשי.
- `proc-electrical-cables-wet.html` | כבלים, חיבורים וסביבה רטובה | 💧 | #b7950b | כבלים ללא נזק/שחיקה, מוגנים מדריסה, שקעים תקינים ללא עומס יתר, דרגת הגנה IP בסביבה רטובה, תוכנית חשמל מעודכנת.

## GROUP P4 — scaffolding + confined
- `proc-scaffolding-erection.html` | הקמת פיגום ומבנה | 🪜 | #1a7a6e | הקמה ע"י מוסמך, תעודת בטיחות פיגום ממהנדס, בסיסים יציבים ומשוּוים, מהדקים מאושרים.
- `proc-scaffolding-platforms-access.html` | רצפות, מעקות וכניסה | 🛟 | #1a7a6e | לוחות רצפה שלמים (פערים < 3 ס"מ), מעקה עליון/אמצעי/תחתון, סולם מאובטח, כניסה אחת מסומנת.
- `proc-scaffolding-workers-inspect.html` | עובדים ובדיקות פיגום | 👷 | #1a7a6e | רתמה מחוברת לעיגון, איסור עומס יתר, בדיקה לאחר מזג אוויר קשה, רישום יומי של מצב הפיגום.
- `proc-confined-entry-permit.html` | היתר כניסה ושומר כניסה | 🚪 | #4a4a4a | היתר כניסה חתום, נוהל מאושר, שומר כניסה נוכח שאינו עוזב, פתח רחב מספיק לחילוץ עם ציוד.
- `proc-confined-atmosphere.html` | בדיקות אטמוספרה וניטור אוויר | 🫧 | #4a4a4a | חמצן 19.5%–23.5%, גזים דליקים/רעילים CO/H2S, ניטור מתמשך לאורך השהייה.
- `proc-confined-rescue-energy.html` | ציוד חילוץ, אנרגיה ותקשורת | 🆘 | #4a4a4a | SCBA/SABA זמין ובדוק, ציוד חילוץ בכניסה, ניתוק ונעילת אנרגיה (LOTO), תקשורת רציפה פנים-חוץ.

## GROUP P5 — chemicals + ergonomics
- `proc-chemicals-id-storage.html` | זיהוי, סימון ואחסון חומרים מסוכנים | ☣️ | #6c3483 | סימון GHS, SDS נגישים, אחסון דליקים באוגרים מוגני אש, הפרדת חומרים לא תואמים, כמות מינימלית בשטח.
- `proc-chemicals-handling.html` | טיפול בחומרים מסוכנים ומיגון | 🧤 | #6c3483 | PPE מתאים (כפפות/משקפי מגן/סינר), אוורור בעת שימוש בנדיפים, ברז שטיפת עיניים/מקלחת חירום.
- `proc-chemicals-waste-emergency.html` | פסולת, חירום והכשרה | 🛢️ | #6c3483 | פסולת מסומנת ומאוחסנת, פינוי ע"י גוף מורשה, הדרכה ספציפית, נוהל זיהום/שפיכה.
- `proc-ergonomics-lifting.html` | הרמה, סחיבה ועזרים מכניים | 🏋️ | #1e8449 | טכניקת הרמה נכונה, מעל 25 ק"ג עזרה מכנית/שניים, עגלות הובלה, כלים מתאימים ללא לחץ יתר.
- `proc-ergonomics-posture.html` | תנוחת עבודה ועמדות | 🪑 | #1e8449 | גובה משטחי עבודה מותאם, מניעת עמידה/ישיבה ממושכת, בדיקת תנוחה בעבודה חוזרת.
- `proc-ergonomics-env-breaks.html` | סביבת עבודה והפסקות | ☀️ | #1e8449 | תאורה מספקת, טמפרטורה סבירה (לא חום/קור קיצוני), הפסקות קצרות בעבודה פיזית מאומצת.

## GROUP P6 — emergency + traffic
- `proc-emergency-plan-evac.html` | תכנית חירום ופינוי | 🚨 | #922b21 | תכנית כתובה ומאושרת, נקודות כינוס מסומנות, מסלולי פינוי, ממונה פינוי לכל קומה/מתחם, תרגיל שנתי.
- `proc-emergency-first-aid.html` | עזרה ראשונה ומוכנות רפואית | 🩺 | #922b21 | ערכות עזרה ראשונה מאוישות ומסומנות, לפחות 2 מוסמכי עזרה ראשונה בכל משמרת, חידוש הסמכה כל 3 שנים.
- `proc-emergency-shelter-comm.html` | מרחב מוגן ותקשורת חירום | 📢 | #922b21 | ממ"ד/מרחב מוגן נגיש ולא חסום, דלת אוטמת תקינה, מערכת כריזה/התרעה פעילה, נוהל דיווח אירוע.
- `proc-traffic-signage.html` | שילוט והפרדת תנועה | 🚸 | #d35400 | תמרורים בכניסה ובכביש האתר, שילוט מהירות, הפרדת הולכי רגל מרכבים, מחסומים פיזיים.
- `proc-traffic-access-parking.html` | כניסה, יציאה וחניה | 🅿️ | #d35400 | מחסומים ושערים תקינים, נהג מכוון בשעות עמוסות, אזורי חניה מסומנים, חניית כלי רכב כבדים נפרדת.
- `proc-traffic-lighting-drivers.html` | תאורה ונהגים | 💡 | #d35400 | תאורת לילה מספקת בנתיבי תנועה, נהגים מורשים בלבד לכלי רכב כבדים.

## GROUP PERMITS-A (color #1e3a5f for all)
Each is a guide to the permit/license: מהו, מי מנפיק, מתי נדרש, תוקף וחידוש, מסמכים נלווים, תהליך הוצאה, צ'קליסט תקפות, חתימות.
- `permit-safety-officer-appointment.html` | מינוי ממונה בטיחות | 👷 | #1e3a5f | כתב מינוי ממונה בטיחות מוסמך, תקנות ארגון הפיקוח על העבודה (ממונים על הבטיחות), הודעה למפקח עבודה אזורי.
- `permit-building.html` | היתר בנייה | 🏗️ | #1e3a5f | היתר מהוועדה המקומית לתכנון ובנייה, תוקף, הצגה באתר, תנאים נלווים.
- `permit-infrastructure.html` | היתר עבודות תשתית | ⛏️ | #1e3a5f | היתר חפירה, תיאום תשתיות מפ"י, אישורי חברות תשתית (חשמל/גז/מים/תקשורת).
- `permit-business-license.html` | רישיון עסק | 🏭 | #1e3a5f | רישיון עסק לפי חוק רישוי עסקים, תנאי כיבוי/סביבה, חידוש.
- `permit-road-work.html` | היתר עבודה בכביש | 🚦 | #1e3a5f | היתר נתיבי ישראל/רשות מקומית, תכנית הסדרי תנועה, אישור משטרה.
- `permit-fire-approval.html` | אישור כיבוי אש | 🔥 | #1e3a5f | אישור כבאות והצלה למערכות גילוי וכיבוי, בדיקה שנתית, תעודה בתוקף.
- `permit-electrical-approval.html` | אישור חשמל | ⚡ | #1e3a5f | תעודת בדיקת מיתקן חשמלי ע"י בודק מוסמך, אישור חברת חשמל לחיבור.

## GROUP PERMITS-B (color #1e3a5f for all)
- `permit-height-work.html` | היתר עבודה בגובה | 🪜 | #1e3a5f | היתר עבודה בגובה חתום, תקנות עבודה בגובה, הסמכות עובדים בתוקף.
- `permit-crane-inspection.html` | אישור בדיקת מנוף | 🏗️ | #1e3a5f | תעודת כושר/בדיקה תקופתית למנוף ע"י בודק מוסמך/מכון התקנים, חצי-שנתי.
- `permit-confined-entry.html` | היתר כניסה למרחב מוגבל | 🚪 | #1e3a5f | היתר כניסה למרחב מוגבל, בדיקת אטמוספרה, שומר כניסה, תכנית חילוץ.
- `permit-hazmat-license.html` | רישיון חומרים מסוכנים | ☣️ | #1e3a5f | היתר רעלים מהמשרד להגנת הסביבה, אחסון ושימוש, כמויות.
- `permit-environmental.html` | אישור סביבתי | 🌿 | #1e3a5f | היתר פינוי/אחסון פסולת, אישור קבלן מורשה, דיווח.
- `permit-occupational-health.html` | אישור בריאות תעסוקתית | 🩺 | #1e3a5f | בדיקות רפואיות תקופתיות ע"י רופא תעסוקתי, מינוי ממונה בריאות.
- `permit-emergency-readiness.html` | אישור מוכנות לחירום | 🚨 | #1e3a5f | תכנית חירום מאושרת, תיאום כבאות/מד"א/פיקוד העורף, תרגיל פינוי.
- `permit-insurance.html` | אישור ביטוח | 📋 | #1e3a5f | פוליסת אחריות מעסיקים וצד שלישי, תוקף, גבולות אחריות, הצגה לפי דרישה.

## GROUP CERTS (color #6d28d9 for all)
Guide to the worker certification: דרישות סף, גוף מסמיך, היקף הסמכה, תקופת תוקף וחידוש (רענון), נושאי ההכשרה, צ'קליסט תקפות, חתימות.
- `cert-height.html` | הסמכת עבודה בגובה | 🪜 | #6d28d9 | תקנות עבודה בגובה, מדריך מוסמך, רענון תקופתי, סוגי עבודה (סולמות/פיגומים/סל הרמה/גגות).
- `cert-forklift.html` | הסמכת מפעיל מלגזה | 🚜 | #6d28d9 | רישיון מפעיל מלגזה, בדיקת כשירות, חידוש, בדיקה יומית למלגזה.
- `cert-crane.html` | הסמכת מפעיל עגורן | 🏗️ | #6d28d9 | רישיון מפעיל עגורן (סוגי עגורנים), כושר רפואי, רענון.
- `cert-first_aid.html` | הסמכת מעניק עזרה ראשונה | 🩺 | #6d28d9 | קורס מד"א/מגן דוד אדום, תוקף 3 שנים, רענון, נושאי החייאה/חבישות.
- `cert-electrical.html` | הסמכת חשמלאי מוסמך | ⚡ | #6d28d9 | רישיון חשמלאי (סוגים — עוזר/מעשי/מוסמך/הנדסאי/בודק), תוקף ורענון.
- `cert-hot_work.html` | הסמכת עבודה חמה | 🔥 | #6d28d9 | הדרכת עבודה חמה (ריתוך/חיתוך), שומר אש, נוהל היתר עבודה חמה.
- `cert-confined.html` | הסמכת עבודה במרחב מוגבל | ⚠️ | #6d28d9 | הדרכת כניסה למרחב מוגבל, שימוש בגלאי גזים ו-SCBA, תפקיד שומר כניסה.
- `cert-scaffolding.html` | הסמכת מקים פיגומים | 🔩 | #6d28d9 | הסמכת בונה פיגומים, סוגי פיגומים, בדיקת תקינות, רענון.
- `cert-welding.html` | הסמכת רתך | 🔧 | #6d28d9 | הסמכת רתך (שיטות ריתוך), בדיקות תקופתיות, ציוד מגן ריתוך, אוורור.

## GROUP TOOLS (color #b45309 for all)
Inspection guide per equipment family: תדירות בדיקה, נקודות בדיקה מפורטות, קריטריוני תקין/פסול, תקנים, ליקויים נפוצים, צ'קליסט, חתימות.
- `tool-electrical.html` | בדיקת כלים חשמליים | ⚡ | #b45309 | בידוד, כבל ותקע, מפסק פחת נייד, סימון בדיקה תקופתית, מבחן בידוד/הארקה.
- `tool-hydraulic.html` | בדיקת כלים הידראוליים | 🔩 | #b45309 | צנרת/צינורות לחץ, דליפות שמן, ספיקה ולחץ, מחברים, שסתומי ביטחון.
- `tool-lifting.html` | בדיקת מתקני הרמה | 🏗️ | #b45309 | כבלים/שרשראות/רצועות, וו עם נועל, תעודת כושר, עומס עבודה בטוח (SWL), בלאי.
- `tool-hand_tools.html` | בדיקת כלי יד | 🔧 | #b45309 | ידיות שלמות, ראשים לא פגומים, חדות/שלמות, בידוד בכלי חשמל, אחסון.
- `tool-pressure.html` | בדיקת ציוד לחץ | 🅿️ | #b45309 | מכלי לחץ/קומפרסור, שסתום ביטחון, מד לחץ מכויל, בדיקת בודק מוסמך, ת"י.
- `tool-pneumatic.html` | בדיקת כלים פנאומטיים | 💨 | #b45309 | צינורות אוויר ומחברים, מסנן/משמן, לחץ עבודה, מגיני ניתוק, רעש.

## GROUP PROJECTS (color #0f766e for all)
Standard project-level safety documents (templates applicable to any project): מטרה, מבנה המסמך, מה הוא כולל, מי אחראי, מתי מעדכנים, צ'קליסט, חתימות.
- `project-safety-file.html` | תיק בטיחות פרויקט | 📁 | #0f766e | מבנה תיק הבטיחות: מינויים, היתרים, סקרי סיכונים, נהלים, רשימות נוכחות/הדרכות, דוחות.
- `project-safety-plan.html` | תוכנית ניהול בטיחות | 📐 | #0f766e | תכנית ניהול הבטיחות לאתר, יעדים, אחריות, נהלים, בקרה ומדידה.
- `project-risk-survey.html` | סקר סיכונים | ⚠️ | #0f766e | מתודולוגיית הערכת סיכונים (סבירות×חומרה), זיהוי מפגעים, אמצעי בקרה, מעקב תיקון.
- `project-site-opening.html` | נוהל פתיחת אתר | 🚧 | #0f766e | רשימת פעולות לפתיחת אתר: הודעה לביטוח לאומי, מינוי ממונה, גידור, שילוט, תשתיות.
- `project-emergency-plan.html` | תכנית חירום לפרויקט | 🚨 | #0f766e | תרחישי חירום, נקודות כינוס, בעלי תפקידים, אנשי קשר, פינוי ותרגול.
- `project-site-closing.html` | נוהל סגירת אתר | 🏁 | #0f766e | פירוק והחזרת מצב, פינוי פסולת, ניתוק תשתיות זמניות, דוח סיכום בטיחות.
