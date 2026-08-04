import { RefreshCw } from 'lucide-react';
import { Users, Activity, TrendingUp, BarChart3, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Stats {
  totalUsers: number;
  totalRequests: number;
  successfulRequests?: number;
  failedRequests?: number;
  inactiveQRCodes: number;
  inactiveUsers?: number;
  lastUpdated?: string;
}

interface StatisticsCardsProps {
  stats: Stats | null;
  onRefresh?: () => void;
  loading?: boolean;
}

export function StatisticsCards({ stats, onRefresh, loading = false }: StatisticsCardsProps) {
  const { t } = useTranslation();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cards = [
    {
      title: t('admin.stats.totalUsers'),
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-500'
    },
    {
      title: t('admin.stats.totalRequests'),
      value: stats?.totalRequests || 0,
      icon: Activity,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-500'
    },
    {
      title: t('admin.stats.inactiveUsers'),
      value: stats?.inactiveUsers || 0,
      icon: Users,
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-500'
    },
    {
      title: t('admin.stats.inactiveQRCodes'),
      value: stats?.inactiveQRCodes || 0,
      icon: QrCode,
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="feature-card p-6 text-center relative overflow-hidden flex flex-row justify-between items-center">
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5`}></div>

              {/* Icon */}
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center relative z-10`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                {/* Value */}
                <div className="text-end text-3xl font-bold gradient-text mb-1 relative z-10">
                  {formatNumber(card.value)}
                </div>
                {/* Title */}
                <p className="text-end text-gray-600 dark:text-gray-400 relative z-10">
                  {card.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
