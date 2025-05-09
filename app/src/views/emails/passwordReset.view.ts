const PASSWORD_RESET = `doctype html
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

export { PASSWORD_RESET };
