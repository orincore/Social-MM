import { cn } from "@/lib/utils"

type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'linkedin' | 'facebook';

const platformConfig = {
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-pink-500 to-purple-600',
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: 'bg-red-600',
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
  },
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-blue-400',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-600',
  },
  facebook: {
    name: 'Facebook',
    icon: '👍',
    color: 'bg-blue-700',
  },
} as const;

interface PlatformBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  platform: Platform;
  showIcon?: boolean;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PlatformBadge({
  platform,
  showIcon = true,
  showName = true,
  size = 'md',
  className,
  ...props
}: PlatformBadgeProps) {
  const config = platformConfig[platform] || { name: platform, icon: '🌐', color: 'bg-gray-500' };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  
  const iconSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full text-white font-medium',
        config.color,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showIcon && <span className={`mr-1 ${iconSize[size]}`}>{config.icon}</span>}
      {showName && <span>{config.name}</span>}
    </div>
  );
}
