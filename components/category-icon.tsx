import { Briefcase, Laptop, TrendingUp, Gift, CirclePlus, Utensils, ShoppingBasket, Car, Home, Zap, ShoppingBag, HeartPulse, Clapperboard, GraduationCap, Plane, Repeat, CircleEllipsis, Tag, type LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = { Briefcase, Laptop, TrendingUp, Gift, CirclePlus, Utensils, ShoppingBasket, Car, Home, Zap, ShoppingBag, HeartPulse, Clapperboard, GraduationCap, Plane, Repeat, CircleEllipsis, Tag };

export function CategoryIcon({ name, color, className = 'h-5 w-5' }: { name?: string | null; color?: string | null; className?: string }) {
  const Icon = (name && MAP[name]) || Tag;
  return <Icon className={className} style={{ color: color ?? '#8C8C8C' }} aria-hidden />;
}
