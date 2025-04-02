import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  BarChart3,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  BanknoteIcon,
} from "lucide-react";
import { Client, Receivable } from "../types/database";

interface DashboardStats {
  totalClients: number;
  clientsNeedingReminder: number;
  activeReminders: number;
  resolvedReminders: number;
  totalReceivables: number;
  totalAmount: number;
  overdueAmount: number;
  averagePaymentDelay: number;
  reminderSteps: {
    first: number;
    second: number;
    third: number;
    final: number;
    legal: number;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    clientsNeedingReminder: 0,
    activeReminders: 0,
    resolvedReminders: 0,
    totalReceivables: 0,
    totalAmount: 0,
    overdueAmount: 0,
    averagePaymentDelay: 0,
    reminderSteps: {
      first: 0,
      second: 0,
      third: 0,
      final: 0,
      legal: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();

    // Mettre en place un écouteur pour les changements en temps réel
    const clientsSubscription = supabase
      .channel("clients-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => {
          fetchDashboardStats();
        }
      )
      .subscribe();

    const receivablesSubscription = supabase
      .channel("receivables-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "receivables" },
        () => {
          fetchDashboardStats();
        }
      )
      .subscribe();

    return () => {
      clientsSubscription.unsubscribe();
      receivablesSubscription.unsubscribe();
    };
  }, []);

  const getReminderStep = (receivable: Receivable & { client: Client }) => {
    const dueDate = new Date(receivable.due_date);
    const today = new Date();
    const daysLate = Math.ceil(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLate <= 0) return null;

    const delays = [
      { days: receivable.client.reminder_delay_1 || 15, step: "first" },
      { days: receivable.client.reminder_delay_2 || 30, step: "second" },
      { days: receivable.client.reminder_delay_3 || 45, step: "third" },
      { days: receivable.client.reminder_delay_final || 60, step: "final" },
    ];

    for (let i = delays.length - 1; i >= 0; i--) {
      if (daysLate >= delays[i].days) {
        return delays[i].step;
      }
    }

    return null;
  };

  const fetchDashboardStats = async () => {
    try {
      // Récupérer les clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) throw clientsError;

      // Récupérer les créances avec leurs clients
      const { data: receivablesData, error: receivablesError } =
        await supabase.from("receivables").select(`
          *,
          client:clients(*)
        `);

      if (receivablesError) throw receivablesError;

      // Calculer les statistiques
      const totalClients = clientsData?.length || 0;
      const clientsNeedingReminder =
        clientsData?.filter((c) => c.needs_reminder)?.length || 0;

      const receivables = receivablesData || [];
      const totalReceivables = receivables.length;
      const totalAmount = receivables.reduce((sum, r) => sum + r.amount, 0);

      const today = new Date();
      const overdueReceivables = receivables.filter(
        (r) => new Date(r.due_date) < today
      );
      const overdueAmount = overdueReceivables.reduce(
        (sum, r) => sum + r.amount,
        0
      );

      // Calculer les retards de paiement moyens
      const delays = receivables
        .filter((r) => r.status === "paid")
        .map((r) => {
          const dueDate = new Date(r.due_date);
          const paidDate = new Date(r.updated_at);
          return Math.max(
            0,
            Math.ceil(
              (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          );
        });

      const averagePaymentDelay =
        delays.length > 0
          ? Math.round(
              delays.reduce((sum, delay) => sum + delay, 0) / delays.length
            )
          : 0;

      // Calculer les étapes de relance
      const reminderSteps = {
        first: 0,
        second: 0,
        third: 0,
        final: 0,
        legal: 0,
      };

      receivables.forEach((receivable) => {
        if (receivable.status === "legal") {
          reminderSteps.legal++;
        } else {
          const step = getReminderStep(receivable);
          if (step) {
            reminderSteps[step as keyof typeof reminderSteps]++;
          }
        }
      });

      setStats({
        totalClients,
        clientsNeedingReminder,
        activeReminders: overdueReceivables.length,
        resolvedReminders: receivables.filter((r) => r.status === "paid")
          .length,
        totalReceivables,
        totalAmount,
        overdueAmount,
        averagePaymentDelay,
        reminderSteps,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-gray-600">
          Vue d'ensemble de vos relances clients
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Clients */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Total Clients</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.totalClients}
          </p>
        </div>

        {/* Montant total des créances */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <BanknoteIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Montant total</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(stats.totalAmount)}
          </p>
        </div>

        {/* Montant en retard */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">
            Montant en retard
          </h3>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(stats.overdueAmount)}
          </p>
        </div>

        {/* Retard moyen de paiement */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">
            Retard moyen de paiement
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.averagePaymentDelay} jours
          </p>
        </div>
      </div>

      {/* Statistiques des relances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Étapes de relance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Étapes de relance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">1ère relance</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (stats.reminderSteps.first / stats.totalReceivables) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.reminderSteps.first}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">2ème relance</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (stats.reminderSteps.second / stats.totalReceivables) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.reminderSteps.second}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">3ème relance</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (stats.reminderSteps.third / stats.totalReceivables) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.reminderSteps.third}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Relance finale</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (stats.reminderSteps.final / stats.totalReceivables) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.reminderSteps.final}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Contentieux</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className="bg-red-700 h-2 rounded-full"
                    style={{
                      width: `${
                        (stats.reminderSteps.legal / stats.totalReceivables) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.reminderSteps.legal}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Statistiques générales
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Clients à relancer</span>
              <span className="text-sm font-medium">
                {stats.clientsNeedingReminder}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Relances actives</span>
              <span className="text-sm font-medium">
                {stats.activeReminders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Relances résolues</span>
              <span className="text-sm font-medium">
                {stats.resolvedReminders}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taux de résolution</span>
              <span className="text-sm font-medium">
                {stats.totalReceivables > 0
                  ? `${Math.round(
                      (stats.resolvedReminders / stats.totalReceivables) * 100
                    )}%`
                  : "0%"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Montant moyen des créances
              </span>
              <span className="text-sm font-medium">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                }).format(
                  stats.totalReceivables > 0
                    ? stats.totalAmount / stats.totalReceivables
                    : 0
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
