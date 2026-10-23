-- Default global categories (idempotent)
insert into public.categories (user_id, name, type, icon, color, is_default) values
 (null,'Salary','income','Briefcase','#D4FF3A',true),
 (null,'Freelance','income','Laptop','#9BE564',true),
 (null,'Investments','income','TrendingUp','#34D399',true),
 (null,'Gifts','income','Gift','#5EEAD4',true),
 (null,'Other income','income','CirclePlus','#A3A3A3',true),
 (null,'Food & Dining','expense','Utensils','#D4FF3A',true),
 (null,'Groceries','expense','ShoppingBasket','#A3E635',true),
 (null,'Transport','expense','Car','#22D3EE',true),
 (null,'Rent & Housing','expense','Home','#FB7185',true),
 (null,'Utilities','expense','Zap','#FBBF24',true),
 (null,'Shopping','expense','ShoppingBag','#F472B6',true),
 (null,'Health','expense','HeartPulse','#F87171',true),
 (null,'Entertainment','expense','Clapperboard','#A78BFA',true),
 (null,'Education','expense','GraduationCap','#60A5FA',true),
 (null,'Travel','expense','Plane','#2DD4BF',true),
 (null,'Subscriptions','expense','Repeat','#C084FC',true),
 (null,'Other expense','expense','CircleEllipsis','#A3A3A3',true)
on conflict (lower(name), type) where user_id is null do nothing;
