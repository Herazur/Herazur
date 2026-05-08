import React from 'react';
    import { cva } from 'class-variance-authority';
    import { cn } from '@/lib/utils';
    import * as LucideIcons from 'lucide-react';
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

    const badgeVariants = cva(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      {
        variants: {
          variant: {
            default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
            secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
            destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
            outline: 'text-foreground',
            tag: 'border-transparent bg-primary/10 text-primary backdrop-blur-sm font-medium hover:bg-primary/20 transition-colors',
            'boost-low': 'border-transparent bg-blue-500 text-white dark:bg-blue-500 dark:text-white',
            'boost-mid': 'border-transparent bg-purple-500 text-white dark:bg-purple-500 dark:text-white',
            'boost-high': 'border-transparent bg-amber-500 text-amber-950 dark:bg-amber-500 dark:text-amber-950',
          },
        },
        defaultVariants: {
          variant: 'default',
        },
      }
    );

    const Badge = ({ className, variant, ...props }) => {
      return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
    };

    const EarnedBadge = ({ badge }) => {
      if (!badge) return null;
      const Icon = badge.icon_name ? LucideIcons[badge.icon_name] : null;
    
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center justify-center text-center gap-2 p-4 rounded-lg bg-card/50 border border-border transition-all hover:bg-card hover:border-primary/50 cursor-pointer">
                <div className="relative h-16 w-16 flex items-center justify-center">
                  {badge.image_url ? (
                    <img src={badge.image_url} alt={badge.name} className="h-full w-full object-contain" />
                  ) : Icon ? (
                    <Icon className="h-10 w-10 text-primary" />
                  ) : (
                    <LucideIcons.Award className="h-10 w-10 text-primary" />
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground max-w-[100px] truncate">{badge.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px]">
              <p className="font-bold text-base">{badge.name}</p>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
              {badge.score_bonus > 0 && <p className="text-sm premium-text mt-2 font-bold">+{badge.score_bonus} Puan</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    };


    export { Badge, badgeVariants, EarnedBadge };