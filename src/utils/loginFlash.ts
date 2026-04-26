/** Parol yangilangach kirish sahifasida bir martalik xabar (location.state lint muammosiz). */
export const LOGIN_FLASH_KEY = 'eq_login_flash'

export function peekLoginFlash(): string | null {
  try {
    return sessionStorage.getItem(LOGIN_FLASH_KEY)
  } catch {
    return null
  }
}

export function clearLoginFlash(): void {
  try {
    sessionStorage.removeItem(LOGIN_FLASH_KEY)
  } catch {
    /* private mode */
  }
}
