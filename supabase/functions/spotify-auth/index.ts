import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, data?: unknown) => {
  console.log(`[SPOTIFY-AUTH] ${step}`, data ? JSON.stringify(data) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Spotify credentials not configured");
    }

    const { action, code, redirect_uri, refresh_token } = await req.json();
    logStep("Action requested", { action });

    if (action === "get_client_id") {
      // Return only the client ID for frontend PKCE flow
      return new Response(
        JSON.stringify({ client_id: clientId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchange_code") {
      // Exchange authorization code for tokens (PKCE flow - no client secret needed client-side)
      logStep("Exchanging code for tokens");
      
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        logStep("Token exchange failed", data);
        throw new Error(data.error_description || "Failed to exchange code");
      }

      logStep("Token exchange successful");
      return new Response(
        JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          token_type: data.token_type,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refresh_token") {
      logStep("Refreshing token");

      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        logStep("Token refresh failed", data);
        throw new Error(data.error_description || "Failed to refresh token");
      }

      logStep("Token refresh successful");
      return new Response(
        JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token || refresh_token,
          expires_in: data.expires_in,
          token_type: data.token_type,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "search") {
      const { query, type, access_token, limit = 20 } = await req.json().catch(() => ({}));
      
      // For search without user auth, use client credentials flow
      let token = access_token;
      
      if (!token) {
        logStep("Getting client credentials token for search");
        const authResponse = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          },
          body: "grant_type=client_credentials",
        });
        
        const authData = await authResponse.json();
        if (!authResponse.ok) {
          throw new Error("Failed to get search token");
        }
        token = authData.access_token;
      }

      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const searchData = await searchResponse.json();
      
      if (!searchResponse.ok) {
        throw new Error(searchData.error?.message || "Search failed");
      }

      return new Response(
        JSON.stringify(searchData),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
