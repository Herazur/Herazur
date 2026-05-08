import React from 'react';
import { cn } from "@/lib/utils";
import { Zap, Crown, Sparkles } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

const tierStyles = {
  0: {
    wrap: "bg-muted/50 border border-border",
    name: "text-foreground",
  },
  1: {
    wrap: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 shadow-[0_0_20px_-8px] shadow-blue-500/60",
    name: "text-blue-400 font-semibold",
  },
  2: {
    wrap: "bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/30 shadow-[0_0_24px_-8px] shadow-fuchsia-500/70",
    name: "text-fuchsia-400 font-semibold",
  },
  3: {
    wrap: "bg-gradient-to-r from-amber-400/15 to-yellow-500/15 border border-amber-400/40 ring-1 ring-yellow-300/30 shadow-[0_0_28px_-6px] shadow-yellow-400/70",
    name: "text-amber-400 font-bold",
  },
};

// Sadece golden username için kontrol
const shouldShowGoldenUsername = (message) => {
  if (!message) return false;

  const tier = Number(message?.super_tier ?? 0);
  const boostType = String(message?.boost_type_id || message?.boost_type || '').toLowerCase();

  // Tier 2+ her zaman golden username
  if (tier >= 2) return true;

  // Monthly Spotlight ve Ultimate Presence golden username
  if (boostType.includes('monthly_spotlight') || boostType.includes('ultimate_presence')) {
    return true;
  }

  // Quick Boost golden username SAHİP DEĞİL
  if (boostType.includes('quick_boost')) {
    return false;
  }

  return tier >= 2;
};

export default function MessageBubble({ message, isOwn = false, className }) {
  const tier = Number(message?.super_tier ?? 0);
  const showGoldenUsername = shouldShowGoldenUsername(message);
  const t = tierStyles[tier] ?? tierStyles[0];

  const username = message?.author_username || '';
  const name = message?.author_name || 'User';
  const avatar = message?.author_avatar_url || '';
  const content = message?.content ?? '';
  const createdAt = message?.created_at ? new Date(message.created_at) : null;

  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : '';

  const profileHref = username ? `/u/${username}` : '#';

  return (
    <div className={cn("flex items-start gap-3", isOwn && "flex-row-reverse", className)}>
      {username ? (
        <Link to={`/u/${username}`}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "rounded-2xl px-4 py-2 max-w-[80%] transition-colors",
          "border",
          t.wrap,
          isOwn && "self-end"
        )}
      >
        <div className={cn("flex items-center gap-2 mb-1", isOwn && "justify-end")}>
          <Link
            to={profileHref}
            onClick={(e) => { if (profileHref === '#') e.preventDefault(); }}
            className={cn(
              "text-sm hover:underline font-medium",
              // SADECE golden username
              showGoldenUsername ? "golden-username" : t.name
            )}
          >
            {name}
          </Link>

          {/* Super Chat badge - normal kurallara göre */}
          {tier >= 2 && (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-1",
              tier === 3
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black"
                : "bg-fuchsia-600 text-white"
            )}>
              {tier === 3 ? <Crown className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              Super Chat
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
          {content}
        </p>

        <div className={cn("mt-1 flex items-center gap-2 text-[11px] text-muted-foreground", isOwn && "justify-end")}>
          {/* Sparkles icon - normal kurallara göre */}
          {tier >= 2 && <Sparkles className="h-3 w-3 text-yellow-400" aria-hidden="true" />}
          {timeAgo && <span>{timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}