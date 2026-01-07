// googleAuth.ts
import {  useGoogleLogin } from "@react-oauth/google";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const useGoogleLoginHandler = (onSuccess: (access_token: string) => void, onError?: (err: any) => void) => {
  const login = useGoogleLogin({
    onSuccess: (credentialResponse) => {
      try {
        console.log(credentialResponse);
        if (!credentialResponse.access_token) throw new Error("No credential returned");
        onSuccess(credentialResponse.access_token);
      } catch (e) {
        onError && onError(e);
      }
    },
    onError: (err) => onError && onError(err),
    flow: "implicit", // or "auth-code" if you have backend
  });

  return login;
};

export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch user info");

  const data = await res.json();
  return {
    id: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}
