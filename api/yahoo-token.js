export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { code, codeVerifier, redirectUri } = req.body;
  if (!code || !codeVerifier || !redirectUri) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const YAHOO_CLIENT_ID = "dj0yJmk9dEVscml2TzNha0JVJmQ9WVdrOU5XOWFUMG95WjBNbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTUy";

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: YAHOO_CLIENT_ID,
    code_verifier: codeVerifier,
  });

  try {
    const tokenRes = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) return res.status(400).json({ error: data.error_description || "Token exchange failed" });
    res.json({ access_token: data.access_token });
  } catch (e) {
    res.status(500).json({ error: "Token exchange error" });
  }
}
