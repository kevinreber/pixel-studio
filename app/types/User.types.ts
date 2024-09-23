export type UserGoogleData = {
  provider: "google";
  displayName: string;
  emails: string[];
  id: string;
  photos: string[];
  _json: {
    email: string;
    family_name: string;
    given_name: string;
    locale: string;
    name: string;
    picture: string;
    sub: string;
  };
};
