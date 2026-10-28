// Configuración pública del panel.
//
// Estos dos valores NO son secretos: la "anon / publishable key" de Supabase
// está pensada para ir en el navegador. La protección real de los datos la
// hacen las políticas RLS de la base de datos (ver supabase/migrations), que
// solo dejan pasar a las cuentas de Rubén e Inés.
//
// NUNCA pongas aquí la "service_role / secret key".
window.ZW_CONFIG = {
    supabaseUrl: 'https://jrgqbqdnjrqfysanzjho.supabase.co',
    supabaseAnonKey: 'sb_publishable_9j0lRvpUcXOQ8zbFWVyMDQ_Ty4WGpXp',
};
