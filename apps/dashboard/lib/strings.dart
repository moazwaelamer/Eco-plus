import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Arabic first, English second (same approach as the mobile app).
class T {
  const T(this.ar);
  final bool ar;
  String _(String a, String e) => ar ? a : e;

  String get appName => 'EcoPlus';
  String get dashboard => _('لوحة التحكم', 'Dashboard');
  String get login => _('تسجيل الدخول', 'Log in');
  String get loginSub => _('لوحة الإدارة والمصانع', 'Admin and factory portal');
  String get identifier => _('الهاتف أو البريد', 'Phone or email');
  String get password => _('كلمة السر', 'Password');
  String get logout => _('خروج', 'Log out');
  String get wrongCredentials => _('الهاتف أو كلمة السر غير صحيحة', 'Wrong phone, email or password');
  String get noConnection => _('تعذّر الاتصال بالخادم', 'Cannot reach the server');
  String get tryAgain => _('حاول مرة أخرى', 'Try again');
  String get notForYou => _('هذا الحساب يعمل من تطبيق الموبايل', 'This account works from the mobile app');
  String get language => _('English', 'العربية');
  String get theme => _('المظهر', 'Theme');
  String get demo => _('جرّب بحساب تجريبي', 'Try a demo account');

  // navigation
  String get overview => _('نظرة عامة', 'Overview');
  String get shipments => _('الشحنات', 'Shipments');
  String get routes => _('المسارات', 'Routes');
  String get orders => _('الطلبات', 'Orders');
  String get invoices => _('الفواتير', 'Invoices');
  String get stock => _('المخزون', 'Stock');
  String get catalog => _('الكتالوج', 'Catalog');

  // overview
  String get waitingShipments => _('شحنات بانتظار سائق', 'Shipments waiting');
  String get routesToday => _('مسارات اليوم', 'Routes today');
  String get openOrders => _('طلبات مفتوحة', 'Open orders');
  String get unpaid => _('فواتير غير مدفوعة', 'Unpaid invoices');
  String get stockTotal => _('المخزون الحالي', 'Stock on hand');
  String get capacityUse => _('استخدام المخزن', 'Warehouse use');
  String get stockByMaterial => _('المخزون حسب الخامة', 'Stock by material');
  String get ordersByStatus => _('الطلبات حسب الحالة', 'Orders by status');
  String get recentOrders => _('آخر الطلبات', 'Recent orders');
  String get nothingYet => _('لا شيء هنا بعد', 'Nothing here yet');

  // shipments / routes
  String get planRoute => _('خطّط مساراً', 'Plan a route');
  String get driver => _('السائق', 'Driver');
  String get vehicle => _('العربية', 'Vehicle');
  String get date => _('التاريخ', 'Date');
  String selected(int n) => _('تم اختيار $n', '$n selected');
  String get createRoute => _('إنشاء المسار', 'Create route');
  String get routeCreated => _('تم إنشاء المسار', 'Route created');
  String get pickShipments => _('اختر الشحنات أولاً', 'Select shipments first');
  String get pickDriverVehicle => _('اختر السائق والعربية', 'Choose a driver and a vehicle');
  String get noDrivers => _('لا يوجد سائقون. أضف سائقاً أولاً.', 'No drivers yet. Add a driver first.');
  String get cancelRoute => _('إلغاء المسار', 'Cancel route');
  String get stops => _('وقفات', 'stops');
  String get fill => _('الامتلاء', 'Fill');
  String get material => _('المادة', 'Material');
  String get all => _('الكل', 'All');

  // orders / invoices
  String get confirm => _('تأكيد', 'Confirm');
  String get dispatch => _('شحن', 'Dispatch');
  String get deliver => _('تسليم', 'Deliver');
  String get cancel => _('إلغاء', 'Cancel');
  String get markPaid => _('تسجيل الدفع', 'Mark paid');
  String get total => _('الإجمالي', 'Total');
  String get due => _('الاستحقاق', 'Due');
  String get factory => _('المصنع', 'Factory');
  String get kg => _('كجم', 'kg');
  String get currency => _('ج.م', 'EGP');
  String get placeOrder => _('اطلب الآن', 'Place order');
  String get orderPlaced => _('تم تسجيل الطلب وحجز المخزون', 'Order placed and stock reserved');
  String get availableKg => _('المتاح', 'Available');
  String get pricePerKg => _('السعر لكل كجم', 'Price per kg');
  String get quantity => _('الكمية (كجم)', 'Quantity (kg)');
  String get cartEmpty => _('أدخل كمية لمادة واحدة على الأقل', 'Enter a quantity for at least one material');
  String get insufficient => _('المخزون لا يكفي لهذه الكمية', 'Not enough stock for that quantity');

  String status(String s) => switch (s) {
        'created' => _('بانتظار سائق', 'Waiting'),
        'assigned' => _('مُسندة', 'Assigned'),
        'collected' => _('تم الاستلام', 'Collected'),
        'weighed' => _('تم الوزن', 'Weighed'),
        'rejected' => _('مرفوضة', 'Rejected'),
        'cancelled' => _('ملغاة', 'Cancelled'),
        'planned' => _('مخطط', 'Planned'),
        'in_progress' => _('جارٍ', 'In progress'),
        'done' => _('منتهي', 'Done'),
        'placed' => _('مُسجّل', 'Placed'),
        'confirmed' => _('مؤكد', 'Confirmed'),
        'dispatched' => _('تم الشحن', 'Dispatched'),
        'delivered' => _('تم التسليم', 'Delivered'),
        'issued' => _('صادرة', 'Issued'),
        'paid' => _('مدفوعة', 'Paid'),
        'overdue' => _('متأخرة', 'Overdue'),
        _ => s,
      };
}

final arabicProvider = NotifierProvider<ArabicNotifier, bool>(ArabicNotifier.new);

class ArabicNotifier extends Notifier<bool> {
  @override
  bool build() => true;
  void toggle() => state = !state;
}

final stringsProvider = Provider<T>((ref) => T(ref.watch(arabicProvider)));
