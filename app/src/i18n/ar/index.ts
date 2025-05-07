import type { Translation } from "../i18n-types";

const ar = {
  // messages
  REIGSTER_SUCCESS: "تم التسجيل بنجاح",
  EMAIL_ALREADY_USED: "البريد الإلكتروني مستخدم بالفعل",
  INVALID_CREDENTIALS: "بيانات الدخول غير صحيحة",
  USER_CAN_ONLY_LOGIN_WITH_LINKED_ACCOUNT:
    "يمكن للمستخدم تسجيل الدخول فقط من خلال الحساب المرتبط",
  LOGIN_SUCCESS: "تم تسجيل الدخول بنجاح",
  INVALID_REFRESH_TOKEN: "رمز تحديث غير صحيح",
  REVOKED_REFRESH_TOKEN: "تم إلغاء رمز تحديث",
  REVOKED_ACCESS_TOKEN: "تم إلغاء رمز الوصول",
  TOKENS_REFRESHED_SUCCESSFULLY: "تم تحديث الرموز بنجاح",
  INVALID_ACCESS_TOKEN: "رمز الوصول غير صحيح",
  LOGOUT_SUCCESS: "تم تسجيل الخروج بنجاح",
  CAN_NOT_SEND_VERIFICATION_CODE: "لا يمكن إرسال رمز التحقق",
  USER_DOES_NOT_HAVE_AN_EMAIL: "ليس لدي المستخدم بريد إلكتروني",
  VERIFICATION_CODE_ALREADY_SENT: "تم إرسال رمز التحقق بالفعل",
  VERIFICATION_CODE_COULD_NOT_BE_SENT: "لا يمكن إرسال رمز التحقق",
  VERIFICATION_CODE_SENT_SUCCESSFULLY: "تم إرسال رمز التحقق بنجاح",
  INVALID_OR_EXPIRED_VERIFICATION_CODE:
    "رمز التحقق غير صحيح أو منتهي الصلاحية",
  USER_VERIFICATION_SUCCESS: "تم التحقق من المستخدم بنجاح",
  PASSWORD_RESET_CODE_SENT_SUCCESSFULLY:
    "تم إرسال رمز إعادة تعيين كلمة المرور بنجاح",
  PASSWORD_RESET_CODE_ALREADY_SENT:
    "تم إرسال رمز إعادة تعيين كلمة المرور بالفعل",
  PASSWORD_RESET_CODE_COULD_NOT_BE_SENT:
    "لا يمكن إرسال رمز إعادة تعيين كلمة المرور",
  INVALID_OR_EXPIRED_PASSWORD_RESET_CODE:
    "رمز إعادة تعيين كلمة المرور غير صحيح أو منتهي الصلاحية",
  PASSWORD_RESET_SUCCESS: "تم إعادة تعيين كلمة المرور بنجاح",
  PASSWORD_NOT_SET: "لم يتم تعيين كلمة المرور",
  PASSWORD_INCORRECT: "كلمة المرور غير صحيحة",
  PASSWORD_CHANGE_SUCCESS: "تم تغيير كلمة المرور بنجاح",
  PASSWORD_ALREADY_SET: "تم تعيين كلمة المرور بالفعل",
  PASSWORD_SET_SUCCESS: "تم تعيين كلمة المرور بنجاح",
  USER_CREATED_AND_LOGGED_IN_SUCCESSFULLY:
    "تم إنشاء المستخدم وتسجيل الدخول بنجاح",
  ASSOCIATED_EMAIL_ALREADY_USED: "البريد الإلكتروني المرتبط مستخدم بالفعل",
  ACCOUNT_COULD_NOT_BE_LINKED: "لم نتمكن من ربط الحساب",
  ACCOUNT_LINK_SUCCESS: "تم ربط الحساب بنجاح",
  ACCOUNT_NOT_FOUND: "لم يتم العثور على الحساب",
  ACCOUNT_UNLINK_SUCCESS: "تم إلغاء ربط الحساب بنجاح",
  ACCOUNTS_RETRIEVED_SUCCESSFULLY: "تم استرجاع الحسابات بنجاح",
  USER_RETRIEVED_SUCCESSFULLY: "تم استرجاع المستخدم بنجاح",
  USER_UPDATE_SUCCESS: "تم تحديث المستخدم بنجاح",
  USER_PROFILE_RETRIEVED_SUCCESSFULLY: "تم استرجاع ملف المستخدم بنجاح",
  USER_PROFILE_UPDATE_SUCCESS: "تم تحديث ملف المستخدم بنجاح",
  NO_IMAGE_PROVIDED: "لم يتم تقديم صورة",
  INVALID_IMAGE_FORMAT: "تنسيق الصورة غير صحيح",
  PROFILE_IMAGE_UPDATE_SUCCESS: "تم تحديث صورة الملف الشخصي بنجاح",
  ACCESS_DENIED: "الوصول ممنوع",
  UNABLE_TO_UPLOAD_IMAGE: "لا يمكن رفع الصورة",
  INPUT_VALIDATION_ERROR: "خطأ في البيانات المدخلة",

  INTERNAL_SERVER_ERROR: "حدث خطأ بالخادم",

  // details
  EMAIL_ALREADY_USED_DETAILS: "الرجاء اختيار بريد إلكتروني آخر",
  INVALID_CREDENTIALS_DETAILS:
    "الرجاء التحقق من البريد الإلكتروني وكلمة المرور وحاول مرة أخرى",
  USER_CAN_ONLY_LOGIN_WITH_LINKED_ACCOUNT_DETAILS:
    "الرجاء تسجيل الدخول من خلال الحساب المرتبط (مثل Google أو Facebook)",
  INVALID_REFRESH_TOKEN_DETAILS: "الرجاء توفير رمز تحديث صحيح",
  REVOKED_REFRESH_TOKEN_DETAILS: "الرجاء توفير رمز تحديث صحيح",
  INVALID_ACCESS_TOKEN_DETAILS: "الرجاء توفير رمز الوصول صحيح",
  REVOKED_ACCESS_TOKEN_DETAILS: "الرجاء توفير رمز الوصول صحيح",
  USER_ALREADY_VERIFIED_DETAILS: "تم التحقق من المستخدم بالفعل",
  USER_DOES_NOT_HAVE_AN_EMAIL_DETAILS: "الرجاء تعيين بريد إلكتروني",
  VERIFICATION_CODE_ALREADY_SENT_DETAILS: "الرجاء التحقق من بريدك الإلكتروني",
  VERIFICATION_CODE_COULD_NOT_BE_SENT_DETAILS: "الرجاء المحاولة في وقت لاحق",
  INVALID_OR_EXPIRED_VERIFICATION_CODE_DETAILS: "الرجاء توفير رمز التحقق صحيح",
  PASSWORD_RESET_CODE_ALREADY_SENT_DETAILS: "الرجاء المحاولة في وقت لاحق",
  PASSWORD_RESET_CODE_COULD_NOT_BE_SENT_DETAILS: "الرجاء المحاولة في وقت لاحق",
  INVALID_OR_EXPIRED_PASSWORD_RESET_CODE_DETAILS:
    "الرجاء توفير رمز إعادة تعيين كلمة المرور صحيح",
  PASSWORD_NOT_SET_DETAILS: "الرجاء تعيين كلمة المرور",
  PASSWORD_INCORRECT_DETAILS: "الرجاء التحقق من كلمة المرور وحاول مرة أخرى",
  PASSWORD_ALREADY_SET_DETAILS:
    "الرجاء تسجيل الدخول باستخدام كلمة المرور الحالية",
  ASSOCIATED_EMAIL_ALREADY_USED_DETAILS:
    "الرجاء تسجيل الدخول أو استخدام بريد إلكتروني آخر",
  ACCOUNT_COULD_NOT_BE_LINKED_DETAILS: "الرجاء المحاولة في وقت لاحق",
  PLEASE_PROVIDE_AN_IMAGE: "الرجاء تقديم صورة",
  MISSING_AUTHORIZATION_TOKEN_DETAILS: "الرجاء توفير رمز الوصول",
  UNABLE_TO_UPLOAD_IMAGE_DETAILS: "الرجاء المحاولة في وقت لاحق",

  INTERNAL_SERVER_ERROR_DETAILS: "الرجاء المحاولة في وقت لاحق",

  // Zod error message
  INVALID_EMAIL: "البريد الإلكتروني غير صحيح",
  PASSWORDS_DO_NOT_MATCH: "كلمة المرور غير متطابقة",
  INVALID_PASSWORD: "كلمة المرور غير صحيحة",
  PASSWORD_TOO_SHORT:
    "يجب علي كلمة المرور أن تتكون من {min} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أدني",
  FIRST_NAME_TOO_SHORT:
    "يجب علي الإسم الأول أن يتكون من {min} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أدني",
  FIRST_NAME_TOO_LONG:
    "يجب علي الإسم الأول أن يتكون من {max} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أقصي",
  LAST_NAME_TOO_SHORT:
    "يجب علي إسم العائلة أن يتكون من {min} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أدني",
  LAST_NAME_TOO_LONG:
    "يجب علي إسم العائلة أن يتكون من {max} {{لاشئ|حرف|حرفين|حروف|حرف}} كحد أقصي",
  CODE_IS_REQUIRED: "يرجى تقديم كود صالح",
  FIELD_IS_REQUIED: "هذا الحقل مطلوب",
  INVALID_CODE: "كود غير صحيح، يأتي الكود في هذه الصيغة: XXX-XXX",
} satisfies Translation;

export default ar;
