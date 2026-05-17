import { useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import Landing from "./pages/Landing";
import Dispatch from "./pages/Dispatch";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import DispatchShell from "./components/dispatch/DispatchShell";
import type { NavId } from "./components/dispatch/SideNav";
import "./styles.css";

Amplify.configure(outputs);

type Route = "landing" | "dispatch" | "drivers" | "vehicles";

export default function App() {
  const [route, setRoute] = useState<Route>("landing");

  const handleNav = (id: NavId) => {
    if (id === "dispatch" || id === "drivers" || id === "vehicles") setRoute(id);
  };

  return (
    <Authenticator>
      {({ signOut, user }) => {
        const isSignedIn = !!user;
        const email = user?.signInDetails?.loginId;

        if (route === "landing") {
          return (
            <Landing
              isSignedIn={isSignedIn}
              onSignIn={() => setRoute("dispatch")}
              onSignOut={() => { signOut?.(); setRoute("landing"); }}
              onGoToApp={() => setRoute("dispatch")}
            />
          );
        }

        // App shell wraps Drivers + Vehicles so they get the sidebar
        if (route === "drivers") {
          return (
            <DispatchShell activeNav="drivers" onNavChange={handleNav} userEmail={email} onSignOut={() => { signOut?.(); setRoute("landing"); }}>
              <Drivers />
            </DispatchShell>
          );
        }

        if (route === "vehicles") {
          return (
            <DispatchShell activeNav="vehicles" onNavChange={handleNav} userEmail={email} onSignOut={() => { signOut?.(); setRoute("landing"); }}>
              <Vehicles />
            </DispatchShell>
          );
        }

        // Default: dispatch
        return (
          <Dispatch
            onSignOut={() => { signOut?.(); setRoute("landing"); }}
            onNavChange={handleNav}
          />
        );
      }}
    </Authenticator>
  );
}
