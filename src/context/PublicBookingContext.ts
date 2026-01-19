import { createContext, useContext } from "react";

type PublicBookingContextType = {
  orgId: string;
  calendarId: string;
};

const PublicBookingContext = createContext<PublicBookingContextType | undefined>(undefined);

export function usePublicBookingContext() {
  return useContext(PublicBookingContext);
}

export { PublicBookingContext };
