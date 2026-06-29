const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid credentials': 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
  'Email already exists': 'Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.',
  'User not found': 'Không tìm thấy tài khoản với email này.',
};

function hasVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
    text,
  );
}

function normalizeApiMessage(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  const msg = Array.isArray(raw) ? raw[0] : raw;
  return msg?.trim() || undefined;
}

/** Chuyển message lỗi auth từ API sang tiếng Việt*/
export function toAuthUserMessage(
  raw: string | string[] | undefined,
  fallback: string,
): string {
  const msg = normalizeApiMessage(raw);
  if (!msg) return fallback;
  if (AUTH_ERROR_MAP[msg]) return AUTH_ERROR_MAP[msg];
  if (hasVietnamese(msg)) return msg;
  return fallback;
}
