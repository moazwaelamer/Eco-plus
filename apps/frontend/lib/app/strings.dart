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

  String get staffTitle => _('لوحة الإدارة على الويب', 'Management lives on the web');
  String get staffBody => _('هذا الدور يعمل من لوحة التحكم على الويب، وهي قيد البناء. تطبيق الموبايل متاح الآن للعملاء والسائقين.', 'This role works from the web dashboard, which is being built. The mobile app is for customers and drivers for now.');
}

final arabicProvider = NotifierProvider<ArabicNotifier, bool>(ArabicNotifier.new);

class ArabicNotifier extends Notifier<bool> {
  @override
  bool build() => true;
  void toggle() => state = !state;
}

final stringsProvider = Provider<S>((ref) => S(ref.watch(arabicProvider)));
