import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmPayment = async () => {
      const userId = searchParams.get("user_id");
      const plan = searchParams.get("plan");

      if (userId && plan) {
        // Update subscription status to active
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "active" })
          .eq("user_id", userId)
          .eq("plan", plan)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error) {
          alert("Payment confirmed! Subscription activated.");
          navigate("/dashboard");
        }
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing payment...</h1>
        <p>Please wait while we confirm your payment.</p>
      </div>
    </div>
  );
}
