export const EMAIL_VERIFICATION = `doctype html
html
  head
    title Email Verification
  body
    h1 Email Verification
    p Hello #{user.firstName},
    p We received a request to verify your email, please use the code below.
    p #{code}
    p Thank you,
    p The Support Team
  `;

export const PASSWORD_RESET = `doctype html
html
  head
    title Password Reset
  body
    h1 Password Reset
    p Hello #{user.firstName},
    p A password reset request has been made for your account. If you did not initiate this request, please ignore this email.
    p #{code}
    p Thank you,
    p The Support Team
  `;
