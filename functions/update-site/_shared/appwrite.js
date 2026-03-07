function createClient(sdk, { endpoint, projectId, apiKey }) {
  const client = new sdk.Client().setEndpoint(endpoint).setProject(projectId);
  if (apiKey) client.setKey(apiKey);
  return client;
}

module.exports = {
  createClient,
};
