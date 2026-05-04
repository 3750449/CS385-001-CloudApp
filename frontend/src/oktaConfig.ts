const oktaConfig = {
  issuer: "https://integrator-770891.okta.com",
  clientId: "0oa12g0g08edpcdcT698",
  redirectUri: window.location.origin + "/login/callback",
  scopes: ["openid", "profile", "email"],
  pkce: true,
};

export default oktaConfig;
