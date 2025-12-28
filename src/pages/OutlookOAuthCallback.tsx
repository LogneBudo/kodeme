import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/**
 * Handles Outlook OAuth callback from frontend
 * (fallback for when Microsoft redirects to frontend instead of backend)
 */
export default function OutlookOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      navigate("/admin/settings?error=" + error + "&provider=outlook");
      return;
    }

    if (!code) {
      console.error("No authorization code received");
      navigate("/admin/settings?error=missing_code&provider=outlook");
      return;
    }

    // If we get here, Microsoft sent code to frontend (misconfigured redirect_uri)
    // Just redirect to admin with success - the code will be lost but at least
    // user isn't stuck on blank page. Proper fix is to update Azure App Registration.
    console.log("OAuth code received on frontend (Azure App misconfigured)");
    navigate("/admin/settings?calendar=callback_received&provider=outlook");
  }, [searchParams, navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <h2>Processing Outlook Calendar connection...</h2>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
