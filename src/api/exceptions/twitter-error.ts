export class TwitterError extends Error {
  constructor(message: string, code?: string, details?: string) {
    super(message);

    if (code !== undefined) {
      Object.defineProperty(this, "code", {
        value: code,
        writable: false,
        enumerable: true,
      });
    }

    if (details !== undefined) {
      Object.defineProperty(this, "details", {
        value: details,
        writable: false,
        enumerable: true,
      });
    }
  }
}
