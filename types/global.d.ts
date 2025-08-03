declare global {
  // This matches the structure expected by oauth-1.0a
  const crypto: {
    createHmac: (
      algorithm: string,
      key: crypto.BinaryLike
    ) => crypto.Hmac
  }
}

export {}
