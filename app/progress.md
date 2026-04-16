   ### Overige ontbrekende onderdelen:                                                                 
    - `app/not-found.tsx` + `app/error.tsx`                                                                  
    - `loading.tsx` skeletons voor alle routes                                                         
    - `app/(dashboard)/session/[sessionId]/page.tsx` (sessie detail view)                
    - `app/(dashboard)/accountability/[week]/page.tsx` (weekly drill-down)         
    - Avatar upload via Supabase Storage                                                                
    - Rate limiting op mutatie routes                                                                        
                                                                                                             
    ## Bekende issues / aandachtspunten                                                                
    - `.env.local`: `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `SUPABASE_SERVICE_ROLE_KEY` zijn nog placeholders     
    - shadcn v4 gebruikt `@base-ui/react` (geen `asChild`) — Button is herschreven met `@radix-ui/react-slot`
    - `DashboardTopbar` gebruikt `onClick + router.push()` in plaats van `asChild` op DropdownMenuItems
    - `formatDuration(string)` en `formatSessionTimer(string)` nemen ISO strings; gebruik
    `formatDurationSeconds(number)` en `formatElapsedSeconds(number)` voor getallen
    - TypeScript errors: 0 (schoon op moment van handoff)                                                    
                                                                                                               
    ## Supabase project                                                                                          
    URL: `https://qlshxzoqmsuukdajnpjp.supabase.co`                                                            
    Tabellen in `supabase/migrations/001_initial_schema.sql` — nog uitvoeren in Supabase dashboard of via CLI    
                                       
    ## Volgende stap om op te pakken                                                                               
    1. Maak `components/features/profile/ProfileEditForm.tsx`
    2. Maak `app/p/[username]/page.tsx`                                                                            
    3. Begin Fase 5: Duo systeem  