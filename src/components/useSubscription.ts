import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

export const useSubscription = (user: User | null) => {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .single();

      setHasSubscription(!!data && !error);
      setLoading(false);
    };

    checkSubscription();
  }, [user]);

  return { hasSubscription, loading };
};
