import { cn } from '@/lib/utils';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import React from 'react';

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef(
  ({ className, src, loading = 'lazy', decoding = 'async', ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    src={src}
    loading={loading}
    decoding={decoding}
    className={cn('aspect-square h-full w-full rounded-full object-cover', className)}
    onError={(e) => {
        const target = e.target;
        const name = target.alt || 'User';
        target.onerror = null;
        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1A1A1A&color=fff&size=128`;
    }}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
