export function extractErrorInfo(error: unknown) {
  let errorName: string | undefined;
  let errorStack: string | undefined;
  let errorMessage: string | undefined;
  let errorStringified: string | undefined;

  if (error instanceof Error) {
    errorName = error.name;
    errorMessage = error.message;
    errorStack = error.stack;
  }

  try {
    errorStringified = JSON.stringify(error);
  } catch (error) {
    console.error("Failed to stringify error", error);
  }

  return {
    errorName,
    errorStack,
    errorMessage,
    errorStringified,
  };
}
