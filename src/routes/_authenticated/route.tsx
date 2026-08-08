import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isAllowedAdminEmail } from "@/lib/admin-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }

    // Restrict access strictly to the 2 authorized admin users
    if (!isAllowedAdminEmail(data.user.email)) {
      await supabase.auth.signOut();
      throw redirect({
        to: "/auth",
        search: { unauthorized: "true" },
      });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
