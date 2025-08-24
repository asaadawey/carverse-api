import { MessageKey } from './en';

// Arabic translations
export const ar: Record<MessageKey, string> = {
  // HTTP Error Messages
  'error.badRequest': 'طلب غير صحيح',
  'error.unauthorized': 'غير مخول',
  'error.somethingWentWrong': 'حدث خطأ ما',
  'error.invalidUsernameOrPassword': 'اسم المستخدم أو كلمة المرور غير صحيحة',
  'error.noSufficientPermissions': 'لا توجد صلاحيات كافية',
  'error.accountInactive': 'حسابك ما زال غير نشط/قيد المعالجة',
  'error.emailNotVerified': 'البريد الإلكتروني غير محقق',
  'error.accountDeleted': 'تم حذف حسابك بناءً على طلبك/طلب المدير',
  'error.duplicateData': 'لا يمكن المتابعة مع هذه العملية لأنها تبدو مكررة. يرجى المحاولة مرة أخرى ببيانات أخرى',
  'error.operationFailed': 'فشلت العملية. يرجى المحاولة مرة أخرى',
  'error.validationError': 'خطأ في التحقق',
  'error.notFound': 'المورد غير موجود',
  'error.internalServerError': 'خطأ داخلي في الخادم',
  'error.emailAlreadyVerified': 'البريد الإلكتروني محقق بالفعل',
  'error.invalidOtp': 'رمز التحقق غير صحيح',

  // Validation Messages
  'validation.required': 'هذا الحقل مطلوب',
  'validation.email': 'يرجى إدخال عنوان بريد إلكتروني صحيح',
  'validation.minLength': 'يجب أن يكون على الأقل {min} حرفاً',
  'validation.maxLength': 'يجب ألا يزيد عن {max} حرفاً',
  'validation.phoneNumber': 'يرجى إدخال رقم هاتف صحيح',
  'validation.password': 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل',

  // Business Logic Messages
  'order.timeout': 'انتهت مهلة الطلب',
  'order.cancelled': 'تم إلغاء الطلب',
  'order.notFound': 'الطلب غير موجود',
  'order.alreadyAccepted': 'تم قبول الطلب بالفعل',
  'order.cannotCancel': 'لا يمكن إلغاء هذا الطلب',
  'order.paymentFailed': 'فشل الدفع',
  'order.providerNotAvailable': 'مقدم الخدمة غير متاح',

  // User Messages
  'user.notFound': 'المستخدم غير موجود',
  'user.alreadyExists': 'المستخدم موجود بالفعل',
  'user.passwordResetSent': 'تم إرسال بريد إلكتروني لإعادة تعيين كلمة المرور',
  'user.profileUpdated': 'تم تحديث الملف الشخصي بنجاح',

  // Provider Messages
  'provider.notFound': 'مقدم الخدمة غير موجود',
  'provider.serviceNotAvailable': 'الخدمة غير متاحة في منطقتك',
  'provider.outOfRange': 'مقدم الخدمة خارج نطاق الخدمة',

  // Payment Messages
  'payment.failed': 'فشل الدفع',
  'payment.successful': 'تم الدفع بنجاح',
  'payment.methodNotSupported': 'طريقة الدفع غير مدعومة',
  'payment.invalidAmount': 'مبلغ الدفع غير صحيح',

  // File Upload Messages
  'upload.failed': 'فشل رفع الملف',
  'upload.invalidFormat': 'تنسيق الملف غير صحيح',
  'upload.sizeTooLarge': 'حجم الملف كبير جداً',

  // General Success Messages
  'success.created': 'تم الإنشاء بنجاح',
  'success.updated': 'تم التحديث بنجاح',
  'success.deleted': 'تم الحذف بنجاح',
  'success.sent': 'تم الإرسال بنجاح',
};
