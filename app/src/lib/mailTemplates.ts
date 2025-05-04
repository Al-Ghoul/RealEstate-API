// AUTO-GENERATED — do not edit
import pugRuntime from "pug-runtime";

type Locals = Record<string, any>;

// -------- EMAIL_VERIFICATION.pug --------
function pug_escape(e) {
  var a = "" + e,
    t = pug_match_html.exec(a);
  if (!t) return e;
  var r,
    c,
    n,
    s = "";
  for (r = t.index, c = 0; r < a.length; r++) {
    switch (a.charCodeAt(r)) {
      case 34:
        n = "&quot;";
        break;
      case 38:
        n = "&amp;";
        break;
      case 60:
        n = "&lt;";
        break;
      case 62:
        n = "&gt;";
        break;
      default:
        continue;
    }
    c !== r && (s += a.substring(c, r)), (c = r + 1), (s += n);
  }
  return c !== r ? s + a.substring(c, r) : s;
}
var pug_match_html = /["&<>]/;
function template_EMAIL_VERIFICATION(locals) {
  var pug_html = "",
    pug_mixins = {},
    pug_interp;
  var locals_for_with = locals || {};

  (function (code, user) {
    pug_html =
      pug_html +
      "\u003C!DOCTYPE html\u003E\u003Chtml\u003E\u003Chead\u003E\u003Ctitle\u003EEmail Verification\u003C\u002Ftitle\u003E\u003C\u002Fhead\u003E\u003Cbody\u003E\u003Ch1\u003EEmail Verification\u003C\u002Fh1\u003E\u003Cp\u003EHello " +
      pug_escape(null == (pug_interp = user.firstName) ? "" : pug_interp) +
      ",\u003C\u002Fp\u003E\u003Cp\u003EWe received a request to verify your email, please use the code below.\u003C\u002Fp\u003E\u003Cp\u003E" +
      pug_escape(null == (pug_interp = code) ? "" : pug_interp) +
      "\u003C\u002Fp\u003E\u003Cp\u003EThank you,\u003C\u002Fp\u003E\u003Cp\u003EThe Support Team\u003C\u002Fp\u003E\u003C\u002Fbody\u003E\u003C\u002Fhtml\u003E";
  }).call(
    this,
    "code" in locals_for_with
      ? locals_for_with.code
      : typeof code !== "undefined"
      ? code
      : undefined,
    "user" in locals_for_with
      ? locals_for_with.user
      : typeof user !== "undefined"
      ? user
      : undefined,
  );
  return pug_html;
}

export const EMAIL_VERIFICATION = (locals: Locals = {}) =>
  template_EMAIL_VERIFICATION(locals, pugRuntime);

// -------- PASSWORD_RESET.pug --------
function pug_escape(e) {
  var a = "" + e,
    t = pug_match_html.exec(a);
  if (!t) return e;
  var r,
    c,
    n,
    s = "";
  for (r = t.index, c = 0; r < a.length; r++) {
    switch (a.charCodeAt(r)) {
      case 34:
        n = "&quot;";
        break;
      case 38:
        n = "&amp;";
        break;
      case 60:
        n = "&lt;";
        break;
      case 62:
        n = "&gt;";
        break;
      default:
        continue;
    }
    c !== r && (s += a.substring(c, r)), (c = r + 1), (s += n);
  }
  return c !== r ? s + a.substring(c, r) : s;
}
var pug_match_html = /["&<>]/;
function template_PASSWORD_RESET(locals) {
  var pug_html = "",
    pug_mixins = {},
    pug_interp;
  var locals_for_with = locals || {};

  (function (code, user) {
    pug_html =
      pug_html +
      "\u003C!DOCTYPE html\u003E\u003Chtml\u003E\u003Chead\u003E\u003Ctitle\u003EPassword Reset Code\u003C\u002Ftitle\u003E\u003C\u002Fhead\u003E\u003Cbody\u003E\u003Ch1\u003EPassword Reset\u003C\u002Fh1\u003E\u003Cp\u003EHello " +
      pug_escape(null == (pug_interp = user.firstName) ? "" : pug_interp) +
      ",\u003C\u002Fp\u003E\u003Cp\u003EA password reset request has been made for your account. If you did not initiate this request, please ignore this email.\u003C\u002Fp\u003E\u003Cp\u003ETo reset your password, copy the code below:\u003C\u002Fp\u003E\u003Cp\u003E" +
      pug_escape(null == (pug_interp = code) ? "" : pug_interp) +
      "\u003C\u002Fp\u003E\u003Cp\u003EThank you,\u003C\u002Fp\u003E\u003Cp\u003EThe Support Team\u003C\u002Fp\u003E\u003C\u002Fbody\u003E\u003C\u002Fhtml\u003E";
  }).call(
    this,
    "code" in locals_for_with
      ? locals_for_with.code
      : typeof code !== "undefined"
      ? code
      : undefined,
    "user" in locals_for_with
      ? locals_for_with.user
      : typeof user !== "undefined"
      ? user
      : undefined,
  );
  return pug_html;
}

export const PASSWORD_RESET = (locals: Locals = {}) =>
  template_PASSWORD_RESET(locals, pugRuntime);
