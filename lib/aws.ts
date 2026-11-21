import "server-only";

/**
 * AWS SDK client config.
 *
 * AWS Amplify Hosting does not allow environment variables that start with "AWS_",
 * so in Amplify set APP_AWS_REGION / APP_AWS_ACCESS_KEY_ID / APP_AWS_SECRET_ACCESS_KEY.
 * Locally the standard AWS_* names keep working. If no keys are set at all, the SDK
 * falls back to its default chain (e.g. an attached IAM role).
 */
export function awsClientConfig() {
  const region =
    process.env.APP_AWS_REGION ?? process.env.AWS_REGION ?? "ap-southeast-2";
  const accessKeyId =
    process.env.APP_AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.APP_AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  return accessKeyId && secretAccessKey
    ? { region, credentials: { accessKeyId, secretAccessKey } }
    : { region };
}

export function awsRegion() {
  return awsClientConfig().region;
}
