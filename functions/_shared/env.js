function getEnv(req) {
  if (req && req.variables && Object.keys(req.variables).length > 0) {
    return req.variables;
  }
  return process.env;
}

function getAppwriteConfig(req, options = {}) {
  const env = getEnv(req);
  const endpoint = env.APPWRITE_FUNCTION_ENDPOINT || env.APPWRITE_ENDPOINT;
  const projectId = env.APPWRITE_FUNCTION_PROJECT_ID || env.APPWRITE_PROJECT_ID;
  const apiKey = env.APPWRITE_FUNCTION_API_KEY || env.APPWRITE_API_KEY || env.APPWRITE_KEY;
  const requireApiKey = options.requireApiKey !== false;

  const missing = [];
  if (!endpoint) missing.push("APPWRITE_ENDPOINT");
  if (!projectId) missing.push("APPWRITE_PROJECT_ID");
  if (requireApiKey && !apiKey) missing.push("APPWRITE_API_KEY");

  return {
    env,
    endpoint,
    projectId,
    apiKey,
    missing,
  };
}

module.exports = {
  getEnv,
  getAppwriteConfig,
};
