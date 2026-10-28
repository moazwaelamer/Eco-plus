import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Arabic first, English second. Plain getters keep it simple until there are enough strings to justify ARB files.
class S {
  const S(this.ar);
  final bool ar;

  String _(String a, String e) => ar ? a : e;

  String get appName => 'EcoPlus';
  String get tagline => _('اجمع، وزّن، واكسب نقاط', 'Collect, weigh, earn points');
  String get welcomeBack => _('أهلاً بعودتك', 'Welcome back');
  String get loginSub => _('سجّل دخولك لمتابعة شحناتك ونقاطك', 'Log in to follow your shipments and points');
  String get identifier => _('الهاتف أو البريد', 'Phone or email');
  String get password => _('كلمة السر', 'Password');
  String get login => _('تسجيل الدخول', 'Log in');
  String get tryDemo => _('جرّب بحساب تجريبي', 'Try a demo account');
  String get logout => _('تسجيل الخروج', 'Log out');
  String get theme => _('تبديل المظهر', 'Switch theme');
  String get language => _('English', 'العربية');
  String get wrongCredentials => _('الهاتف أو كلمة السر غير صحيحة', 'Wrong phone, email or password');
  String get noConnection => _('تعذّر الاتصال بالخادم. تأكد أنه شغّال.', 'Cannot reach the server. Is it running?');
  String get tryAgain => _('حاول مرة أخرى', 'Try again');

  String hello(String name) => _('أهلاً، $name', 'Hello, $name');
  String get points => _('نقطة', 'points');
  String get level => _('المستوى', 'Level');
  String toNext(int n, String level) => _('باقي $n نقطة للوصول إلى $level', '$n points to reach $level');
  String get topLevel => _('وصلت لأعلى مستوى', 'You are at the top level');
  String get scanBag => _('صوّر شنطة', 'Scan a bag');
  String get scanSoon => _('تصوير الشنطة وطلب الاستلام هو الخطوة التالية في التطبيق.', 'Scanning a bag and requesting a pickup comes in the next app update.');
  String get home => _('الرئيسية', 'Home');
  String get shipments => _('شحناتي', 'Shipments');
  String get pointsTab => _('النقاط', 'Points');
  String get noShipments => _('لا توجد شحنات بعد', 'No shipments yet');
  String get noShipmentsSub => _('عندما تطلب استلام شنطة ستظهر هنا مع كود التسليم.', 'When you request a pickup it appears here with its handover code.');
  String get handoverCode => _('كود التسليم', 'Handover code');
  String get giveCode => _('أعطِ هذا الكود للسائق عند وصوله', 'Give this code to the driver on arrival');
  String get leaderboard => _('لوحة المتصدرين', 'Leaderboard');
  String get history => _('سجل النقاط', 'Points history');
  String get noHistory => _('لا توجد نقاط بعد', 'No points yet');
  String get you => _('أنت', 'You');
  String get copied => _('تم النسخ', 'Copied');

  String status(String s) => switch (s) {
        'created' => _('بانتظار سائق', 'Waiting for a driver'),
        'assigned' => _('السائق في الطريق', 'Driver assigned'),
        'collected' => _('تم الاستلام', 'Collected'),
        'weighed' => _('تم الوزن', 'Weighed'),
        'rejected' => _('مرفوضة', 'Rejected'),
        'cancelled' => _('ملغاة', 'Cancelled'),
        _ => s,
      };

  String get today => _('اليوم', 'Today');
  String get noRoute => _('لا يوجد مسار اليوم', 'No route today');
  String get noRouteSub => _('عندما يخصص لك المشرف مساراً سيظهر هنا.', 'When an admin assigns you a route it appears here.');
  String get startRoute => _('ابدأ المسار', 'Start route');
  String get collect => _('استلام', 'Collect');
  String get enterCode => _('أدخل كود العميل', "Enter the customer's code");
  String get confirm => _('تأكيد', 'Confirm');
  String get cancel => _('إلغاء', 'Cancel');
  String stops(int n) => _(n == 1 ? 'وقفة واحدة' : '$n وقفات', n == 1 ? '1 stop' : '$n stops');
  String get wrongCode => _('الكود غير صحيح', 'The code does not match');
  String get routeFinished => _('انتهى المسار. أحسنت!', 'Route finished. Well done!');


  // Register
  String get createAccount => _('إنشاء حساب', 'Create account');
  String get registerSub => _('ابدأ في تحويل الفرز إلى نقاط', 'Start turning sorting into points');
  String get haveAccount => _('لديك حساب؟ سجّل الدخول', 'Have an account? Log in');
  String get noAccount => _('ليس لديك حساب؟ أنشئ واحداً', 'No account? Create one');
  String get fullName => _('الاسم الكامل', 'Full name');
  String get phone => _('رقم الهاتف', 'Phone number');
  String get email => _('البريد الإلكتروني (اختياري)', 'Email (optional)');
  String get accountType => _('نوع الحساب', 'Account type');
  String get citizen => _('فرد', 'Individual');
  String get business => _('نشاط تجاري', 'Business');
  String get businessName => _('اسم النشاط', 'Business name');
  String get businessType => _('نوع النشاط (مقهى، سوبر ماركت…)', 'Business type (cafe, supermarket…)');
  String get errName => _('اكتب اسمك (حرفان على الأقل)', 'Enter your name (at least 2 letters)');
  String get errPhone => _('رقم غير صحيح (أرقام فقط، 8 إلى 15)', 'Invalid number (digits only, 8 to 15)');
  String get errEmail => _('بريد غير صحيح', 'Invalid email');
  String get errPassword => _('8 أحرف على الأقل، بها حرف ورقم', 'At least 8 characters with a letter and a number');
  String get errRequired => _('مطلوب', 'Required');
  String get errConflict => _('هذا الرقم أو البريد مستخدم بالفعل', 'This phone or email is already used');

  // Scan
  String get scanTitle => _('صوّر شنطتك', 'Scan your bag');
  String get photo => _('صورة الشنطة', 'Bag photo');
  String get photoHint => _('التقط صورة أو اختر من المعرض', 'Take a photo or choose from the gallery');
  String get camera => _('الكاميرا', 'Camera');
  String get gallery => _('المعرض', 'Gallery');
  String get changePhoto => _('تغيير الصورة', 'Change photo');
  String get material => _('نوع المحتوى', 'What is inside');
  String get fillLevel => _('مدى امتلاء الشنطة', 'How full is the bag');
  String get location => _('مكان الاستلام', 'Pickup location');
  String get useMyLocation => _('استخدم موقعي الحالي', 'Use my current location');
  String get locationSet => _('تم تحديد الموقع', 'Location set');
  String get locationDenied => _('لم نتمكن من معرفة موقعك. فعّل الإذن أو حاول مرة أخرى.', 'We could not get your location. Allow it and try again.');
  String get testLocation => _('موقع تجريبي (القاهرة)', 'Test location (Cairo)');
  String get requestPickup => _('اطلب استلام', 'Request pickup');
  String get needLocation => _('حدد مكان الاستلام أولاً', 'Set the pickup location first');
  String get sending => _('جاري الإرسال…', 'Sending…');
  String mat(String k) => switch (k) {
        'plastic' => _('بلاستيك', 'Plastic'),
        'paper' => _('ورق', 'Paper'),
        'cardboard' => _('كرتون', 'Cardboard'),
        'glass' => _('زجاج', 'Glass'),
        'aluminium' => _('ألومنيوم', 'Aluminium'),
        'metal' => _('معادن', 'Metal'),
        'mixed' => _('مخلوط', 'Mixed'),
        _ => k,
      };

  // Result
  String get resultReady => _('تم طلب الاستلام', 'Pickup requested');
  String get resultReadySub => _('ستصلك رسالة عند تخصيص سائق، وسيظهر كود التسليم في شحناتي.', 'You will be notified when a driver is assigned. The handover code appears in Shipments.');
  String get resultMerge => _('شنطتك ستنضم لرحلة قريبة', 'Your bag rides along');
  String get resultMergeSub => _('سائق يمر بجوارك، فسنأخذ شنطتك معه حتى لو لم تمتلئ تماماً.', 'A driver passes nearby, so we will take your bag even though it is not full yet.');
  String get resultWait => _('الشنطة لم تمتلئ بعد', 'Not full enough yet');
  String get resultWaitSub => _('نوفر الرحلات: عندما تقترب الشنطة من الامتلاء صوّرها مرة أخرى.', 'We save trips: when the bag is fuller, scan it again.');
  String get shipmentCode => _('رمز الشحنة', 'Shipment code');
  String get viewShipments => _('عرض شحناتي', 'View my shipments');
  String get done => _('تم', 'Done');

  String get staffTitle => _('لوحة الإدارة على الويب', 'Management lives on the web');
  String get notificationsTitle => _('الإشعارات', 'Notifications');
  String get markAllRead => _('تعليم الكل كمقروء', 'Mark all as read');
  String get noNotifications => _('لا توجد إشعارات', 'No notifications');
  String get noNotificationsSub => _('هنخبرك هنا لما يحصل جديد في شحناتك ونقاطك.', 'We will tell you here when something happens with your shipments and points.');
  String get weighTitle => _('وزن الشحنات', 'Weigh shipments');
  String get qrCode => _('كود الشحنة (QR)', 'Shipment QR code');
  String get findShipment => _('بحث', 'Find');
  String get markCollected => _('تأكيد الاستلام', 'Mark collected');
  String get materialLabel => _('الخامة', 'Material');
  String get weightKg => _('الوزن (كجم)', 'Weight (kg)');
  String get grade => _('الدرجة', 'Grade');
  String get acceptShipment => _('قبول', 'Accept');
  String get rejectShipment => _('رفض', 'Reject');
  String get rejectReason => _('سبب الرفض', 'Reason for rejecting');
  String get saveWeighing => _('تسجيل الوزن', 'Save weighing');
  String get weighedOk => _('تم تسجيل الوزن', 'Weighing saved');
  String get alreadyWeighed => _('تم وزن هذه الشحنة بالفعل', 'This shipment is already weighed');
  String get notCollectedYet => _('الشحنة لم تُستلم بعد', 'This shipment has not been collected yet');
  String get weighAnother => _('شحنة أخرى', 'Another shipment');
  String get staffBody => _('هذا الدور يعمل من لوحة التحكم على الويب، وهي قيد البناء. تطبيق الموبايل متاح الآن للعملاء والسائقين.', 'This role works from the web dashboard, which is being built. The mobile app is for customers and drivers for now.');
}

final arabicProvider = NotifierProvider<ArabicNotifier, bool>(ArabicNotifier.new);

class ArabicNotifier extends Notifier<bool> {
  @override
  bool build() => true;
  void toggle() => state = !state;
}

final stringsProvider = Provider<S>((ref) => S(ref.watch(arabicProvider)));
