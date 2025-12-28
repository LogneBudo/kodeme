import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/**
 * Handles Google OAuth callback from frontend
 * (fallback for when Google redirects to frontend instead of backend)
 */
export default function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      navigate("/admin/settings?error=" + error);
      return;
    }

    if (!code) {
      console.error("No authorization code received");
      navigate("/admin/settings?error=missing_code");
      return;
    }

    // If we get here, Google sent code to frontend (misconfigured redirect_uri)
    // Just redirect to admin with success - the code will be lost but at least
    // user isn't stuck on blank page. Proper fix is to update Google Cloud Console.
    console.log("OAuth code received on frontend (Google Cloud misconfigured)");
    navigate("/admin/settings?calendar=callback_received");
  }, [searchParams, navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <h2>Processing Google Calendar connection...</h2>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
