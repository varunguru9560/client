import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAllowedAdminEmail } from "@/lib/admin-auth";

function getFirebaseUser(): Promise<User | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
    // Fallback timeout in case of delay
    setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, 2000);
  });
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getFirebaseUser();
    if (!user) {
      throw redirect({ to: "/auth" });
    }

    // Restrict access strictly to the 2 authorized admin users
    if (!isAllowedAdminEmail(user.email)) {
      await signOut(auth);
      throw redirect({
        to: "/auth",
        search: { unauthorized: "true" },
      });
    }

    return { user };
  },
  component: () => <Outlet />,
});
