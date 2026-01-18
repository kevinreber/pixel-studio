import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserLogin } from "~/services";
import { getUserCreditTransactions, getUserCreditStats } from "~/services/creditTransaction.server";
import { PageContainer } from "~/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowDown, ArrowUp, Plus, Minus, DollarSign, Gift, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const meta: MetaFunction = () => {
  return [{ title: "Credit History - Settings" }];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUserLogin(request);

  const [transactions, stats] = await Promise.all([
    getUserCreditTransactions(user.id, { limit: 100 }),
    getUserCreditStats(user.id),
  ]);

  return json({ transactions, stats });
};

// Helper to get icon and color for transaction type
function getTransactionStyle(type: string, amount: number) {
  switch (type) {
    case "purchase":
      return {
        icon: DollarSign,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        label: "Purchase",
      };
    case "spend":
      return {
        icon: Minus,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        label: "Spent",
      };
    case "refund":
      return {
        icon: Plus,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        label: "Refund",
      };
    case "bonus":
      return {
        icon: Gift,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        label: "Bonus",
      };
    case "admin_adjustment":
      return {
        icon: Shield,
        color: amount > 0 ? "text-green-500" : "text-red-500",
        bgColor: amount > 0 ? "bg-green-500/10" : "bg-red-500/10",
        label: "Admin Adjustment",
      };
    default:
      return {
        icon: ArrowDown,
        color: "text-gray-500",
        bgColor: "bg-gray-500/10",
        label: type,
      };
  }
}

export default function CreditHistoryPage() {
  const { transactions, stats } = useLoaderData<typeof loader>();

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Back to Settings Link */}
        <div className="mb-6">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Credit Transaction History</h1>
          <p className="text-gray-400">
            Complete history of all credit purchases, spending, and refunds
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowUp className="w-5 h-5 text-green-500" />
                  <div className="text-2xl font-bold text-green-500">
                    {stats.totalPurchased}
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-1">Total Purchased</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ArrowDown className="w-5 h-5 text-red-500" />
                  <div className="text-2xl font-bold text-red-500">
                    {stats.totalSpent}
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-1">Total Spent</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Plus className="w-5 h-5 text-blue-500" />
                  <div className="text-2xl font-bold text-blue-500">
                    {stats.totalRefunded}
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-1">Total Refunded</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History List */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No transaction history yet</p>
                <p className="text-sm mt-2">Purchase credits or generate images to see your history here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const style = getTransactionStyle(transaction.type, transaction.amount);
                  const Icon = style.icon;
                  const isPositive = transaction.amount > 0;

                  return (
                    <div
                      key={transaction.id}
                      className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left side - Icon and details */}
                        <div className="flex gap-4 flex-1 items-center">
                          <div className={`flex-shrink-0 p-2 rounded-lg ${style.bgColor}`}>
                            <Icon className={`w-5 h-5 ${style.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {style.label}
                              </Badge>
                              <span className="text-sm text-gray-400">
                                {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                              </span>
                            </div>

                            {transaction.description && (
                              <p className="text-sm text-gray-300">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right side - Amount and balance */}
                        <div className="flex-shrink-0 text-right">
                          <div className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{transaction.amount}
                          </div>
                          <div className="text-xs text-gray-400">
                            Balance: {transaction.balanceAfter}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
