import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchUserAttributes,
  updateUserAttributes,
} from "aws-amplify/auth";

// ── Sign Up ──────────────────────────────────────────────────────────────────
export async function registerUser({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  return signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        name,
      },
      autoSignIn: true,
    },
  });
}

// ── Confirm registration (OTP) ───────────────────────────────────────────────
export async function confirmRegistration(email: string, code: string) {
  return confirmSignUp({ username: email, confirmationCode: code });
}

export async function resendConfirmationCode(email: string) {
  return resendSignUpCode({ username: email });
}

// ── Sign In ──────────────────────────────────────────────────────────────────
export async function loginUser({ email, password }: { email: string; password: string }) {
  return signIn({ username: email, password });
}

// ── Sign Out ─────────────────────────────────────────────────────────────────
export async function logoutUser() {
  return signOut();
}

// ── Password Reset ───────────────────────────────────────────────────────────
export async function requestPasswordReset(email: string) {
  return resetPassword({ username: email });
}

export async function submitPasswordReset({
  email,
  code,
  newPassword,
}: {
  email: string;
  code: string;
  newPassword: string;
}) {
  return confirmResetPassword({
    username: email,
    confirmationCode: code,
    newPassword,
  });
}

// ── Current User ─────────────────────────────────────────────────────────────
export async function getAuthUser() {
  try {
    const user = await getCurrentUser();
    const attrs = await fetchUserAttributes();
    return { user, attrs };
  } catch {
    return null;
  }
}

// ── Update Profile ───────────────────────────────────────────────────────────
export async function updateProfile(attributes: { name?: string; phone_number?: string }) {
  return updateUserAttributes({ userAttributes: attributes });
}
