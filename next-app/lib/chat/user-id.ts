'use client';

const USER_ID_KEY = 'cmugpt-user-id';

export const getOrCreateUserId = (): string => {
  const existing = globalThis.localStorage.getItem(USER_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = globalThis.crypto.randomUUID();
  globalThis.localStorage.setItem(USER_ID_KEY, next);
  return next;
};
