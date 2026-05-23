# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nomina-mensual.e2e.spec.ts >> nomina mensual - E2E real authenticated >> Nómina mensual: verifica, genera, revisa, confirma y recupera al recargar
- Location: tests\nomina-mensual.e2e.spec.ts:123:7

# Error details

```
Test timeout of 300000ms exceeded.
```

```
Error: locator.fill: Test timeout of 300000ms exceeded.
Call log:
  - waiting for locator('#pm-periodo')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - complementary "Navegación principal" [ref=e5]:
    - generic [ref=e6]:
      - img [ref=e9]
      - generic [ref=e13]:
        - generic [ref=e14]: Empresa ERP
        - generic [ref=e15]: Remuneraciones
    - navigation [ref=e16]:
      - list [ref=e17]:
        - listitem [ref=e18]:
          - paragraph [ref=e19]: Principal
          - list [ref=e20]:
            - listitem [ref=e21]:
              - link "Resumen" [ref=e22] [cursor=pointer]:
                - /url: /
                - img [ref=e25]
                - generic [ref=e30]: Resumen
            - listitem [ref=e31]:
              - link "Empleados" [ref=e32] [cursor=pointer]:
                - /url: /empleados
                - img [ref=e35]
                - generic [ref=e40]: Empleados
            - listitem [ref=e41]:
              - link "Nómina mensual Mayo" [ref=e42] [cursor=pointer]:
                - /url: /remuneraciones/proceso-mensual
                - img [ref=e45]
                - generic [ref=e48]: Nómina mensual
                - generic [ref=e49]: Mayo
            - listitem [ref=e50]:
              - link "Liquidaciones" [ref=e51] [cursor=pointer]:
                - /url: /remuneraciones/liquidaciones
                - img [ref=e54]
                - generic [ref=e58]: Liquidaciones
            - listitem [ref=e59]:
              - link "Parámetros" [ref=e60] [cursor=pointer]:
                - /url: /parametros
                - img [ref=e63]
                - generic [ref=e66]: Parámetros
        - listitem [ref=e67]:
          - paragraph [ref=e68]: Gestión
          - list [ref=e69]:
            - listitem [ref=e70]:
              - link "Movimientos" [ref=e71] [cursor=pointer]:
                - /url: /remuneraciones/novedades-mensuales
                - img [ref=e74]
                - generic [ref=e76]: Movimientos
            - listitem [ref=e77]:
              - link "Recurrentes" [ref=e78] [cursor=pointer]:
                - /url: /remuneraciones/haberes-descuentos
                - img [ref=e81]
                - generic [ref=e86]: Recurrentes
            - listitem [ref=e87]:
              - link "Conceptos" [ref=e88] [cursor=pointer]:
                - /url: /remuneraciones/conceptos
                - img [ref=e91]
                - generic [ref=e95]: Conceptos
        - listitem [ref=e96]:
          - paragraph [ref=e97]: Administración
          - list [ref=e98]:
            - listitem [ref=e99]:
              - link "Licencias médicas" [ref=e100] [cursor=pointer]:
                - /url: /licencias-medicas
                - img [ref=e103]
                - generic [ref=e106]: Licencias médicas
            - listitem [ref=e107]:
              - link "Reportes" [ref=e108] [cursor=pointer]:
                - /url: /reportes
                - img [ref=e111]
                - generic [ref=e113]: Reportes
            - listitem [ref=e114]:
              - link "Preguntor" [ref=e115] [cursor=pointer]:
                - /url: /preguntor
                - img [ref=e118]
                - generic [ref=e120]: Preguntor
    - generic [ref=e121]:
      - link "Configuración" [ref=e122] [cursor=pointer]:
        - /url: /parametros
        - img [ref=e124]
        - generic [ref=e127]: Configuración
      - generic "Usuario conectado" [ref=e128]:
        - generic [ref=e129]: P
        - generic [ref=e130]:
          - generic [ref=e131]: prueba
          - generic [ref=e132]: Admin
  - banner [ref=e133]:
    - generic [ref=e134]:
      - navigation "Ruta actual" [ref=e135]:
        - link "Inicio" [ref=e136] [cursor=pointer]:
          - /url: /
          - img [ref=e138]
        - generic [ref=e141]: /
        - link "Remuneraciones" [ref=e142] [cursor=pointer]:
          - /url: /remuneraciones/proceso-mensual
        - generic [ref=e143]: /
        - generic: Nómina mensual
      - generic [ref=e144]:
        - generic [ref=e145]:
          - img [ref=e147]
          - generic [ref=e150]: Borrador generado
        - group [ref=e151]:
          - 'generic "Cambiar período activo. Actual: Mayo 2026" [ref=e152] [cursor=pointer]':
            - generic [ref=e153]:
              - img [ref=e155]
              - generic [ref=e157]: Mayo 2026
              - img [ref=e159]
          - option "2029"
          - option "2028"
          - option "2027"
          - option "2026" [selected]
          - option "2025"
          - option "2024"
          - option "2023"
          - option "2022"
          - option "2021"
          - option "2020"
          - option "2019"
          - option "2018"
          - option "2017"
          - option "2016"
          - option "Enero"
          - option "Febrero"
          - option "Marzo"
          - option "Abril"
          - option "Mayo" [selected]
          - option "Junio"
          - option "Julio"
          - option "Agosto"
          - option "Septiembre"
          - option "Octubre"
          - option "Noviembre"
          - option "Diciembre"
        - button "Confirmar nómina" [ref=e161] [cursor=pointer]:
          - img [ref=e163]
          - generic [ref=e165]: Confirmar nómina
        - generic "Sesión" [ref=e166]:
          - generic [ref=e167]: P
          - button "Salir" [ref=e168] [cursor=pointer]
  - main "Contenido operativo" [ref=e169]:
    - region "Nómina mensual" [ref=e174]:
      - region "Consola del período" [ref=e176]:
        - main "Borrador de nómina mensual generado." [ref=e178]:
          - region "Borrador de nómina mensual generado." [ref=e179]:
            - generic [ref=e181]:
              - img [ref=e184]
              - generic [ref=e188]:
                - heading "Borrador de nómina mensual generado." [level=2] [ref=e189]
                - paragraph [ref=e190]: Revisa trabajadores listos para nomina, movimientos y recurrentes antes de continuar.
              - paragraph [ref=e191]: "Hay 4 trabajadores en revision: 4 listos, 0 por revisar y 0 bloqueados."
          - generic [ref=e192]:
            - complementary "Resumen operativo del período" [ref=e193]:
              - region "Indicadores del período" [ref=e194]:
                - list [ref=e195]:
                  - listitem [ref=e196]:
                    - button "Revisar parámetros del período" [ref=e197] [cursor=pointer]:
                      - img [ref=e200]
                      - generic [ref=e201]:
                        - generic [ref=e202]: Parámetros
                        - generic [ref=e203]: Revisados
                      - img [ref=e205]
                  - listitem [ref=e207]:
                    - button "Ver trabajadores del período" [ref=e208] [cursor=pointer]:
                      - img [ref=e211]
                      - generic [ref=e216]:
                        - generic [ref=e217]: Trabajadores
                        - generic [ref=e218]: 4 listos
                      - img [ref=e220]
                  - listitem [ref=e222]:
                    - button "Ver trabajadores con movimientos" [ref=e223] [cursor=pointer]:
                      - img [ref=e226]
                      - generic [ref=e229]:
                        - generic [ref=e230]: Movimientos
                        - generic [ref=e231]: 2 aprobados · 0 pendientes · 1 vigente
                      - img [ref=e233]
                  - listitem [ref=e235]:
                    - button "Ver liquidaciones del período" [ref=e236] [cursor=pointer]:
                      - img [ref=e239]
                      - generic [ref=e242]:
                        - generic [ref=e243]: Liquidaciones
                        - generic [ref=e244]: Confirme nómina
                      - img [ref=e246]
              - region "Bitácora del período" [ref=e248]:
                - heading "Bitácora del período" [level=3] [ref=e249]
                - list [ref=e250]:
                  - listitem [ref=e251]:
                    - img [ref=e254]
                    - generic [ref=e256]: Verificar período
                    - generic [ref=e257]: Listo
                  - listitem [ref=e258]:
                    - img [ref=e261]
                    - generic [ref=e263]: Generar nómina
                    - generic [ref=e264]: Listo
                  - listitem [ref=e265]:
                    - img [ref=e268]
                    - generic [ref=e271]: Revisar trabajadores
                    - generic [ref=e272]: En curso
                  - listitem [ref=e273]:
                    - img [ref=e276]
                    - generic [ref=e278]: Confirmar nómina
                    - generic [ref=e279]: Pendiente
                  - listitem [ref=e280]:
                    - img [ref=e283]
                    - generic [ref=e285]: Generar liquidaciones
                    - generic [ref=e286]: Pendiente
              - region "Revisión" [ref=e287]:
                - heading "Revisión" [level=3] [ref=e288]
                - paragraph [ref=e289]: Sin bloqueos críticos para confirmar.
              - region "Guía operativa" [ref=e290]:
                - heading "Antes de generar" [level=3] [ref=e291]
                - paragraph [ref=e292]: Primero verifica el período y luego genera la nómina mensual. Después podrás revisar trabajador por trabajador antes de confirmar.
            - generic [ref=e293]:
              - navigation "Nómina mensual" [ref=e294]:
                - button "Detalle mensual 1 por revisar" [ref=e295] [cursor=pointer]:
                  - generic [ref=e296]: Detalle mensual
                  - generic [ref=e297]: 1 por revisar
                - button "Historial" [ref=e298] [cursor=pointer]:
                  - generic [ref=e299]: Historial
              - generic [ref=e300]:
                - generic [ref=e301]:
                  - generic [ref=e302]:
                    - generic [ref=e303]: Detalle mensual
                    - heading "Expediente del período" [level=3] [ref=e304]
                    - paragraph [ref=e305]: Trabajadores, movimientos, liquidaciones y pendientes en una sola vista.
                  - generic [ref=e306]:
                    - generic [ref=e307]:
                      - term [ref=e308]: Trabajadores
                      - definition [ref=e309]: 4 listos
                    - generic [ref=e310]:
                      - term [ref=e311]: Movimientos
                      - definition [ref=e312]: 2 aprobados · 0 pendientes
                    - generic [ref=e313]:
                      - term [ref=e314]: Bloqueos
                      - definition [ref=e315]: "0"
                - generic [ref=e316]:
                  - navigation "Filtros del detalle mensual" [ref=e317]:
                    - button "Situación" [ref=e318] [cursor=pointer]
                    - button "Trabajadores" [ref=e319] [cursor=pointer]
                    - button "Liquidaciones" [ref=e320] [cursor=pointer]
                    - button "Pendientes" [ref=e321] [cursor=pointer]
                  - button "Resumen ampliado del período" [ref=e322] [cursor=pointer]:
                    - img [ref=e324]
                    - generic [ref=e327]: Resumen ampliado
                - region "Revisión de trabajadores del período" [ref=e329]:
                  - status [ref=e330]: Total · 4 trabajadores
                  - navigation "Resumen agregado de trabajadores" [ref=e331]:
                    - button "Total 4" [ref=e332] [cursor=pointer]:
                      - generic [ref=e333]: Total
                      - strong [ref=e334]: "4"
                    - button "Listos 4" [ref=e335] [cursor=pointer]:
                      - generic [ref=e336]: Listos
                      - strong [ref=e337]: "4"
                    - button "Con observaciones 0" [ref=e338] [cursor=pointer]:
                      - generic [ref=e339]: Con observaciones
                      - strong [ref=e340]: "0"
                    - button "Bloqueados 0" [ref=e341] [cursor=pointer]:
                      - generic [ref=e342]: Bloqueados
                      - strong [ref=e343]: "0"
                    - button "Con movimientos 1" [ref=e344] [cursor=pointer]:
                      - generic [ref=e345]: Con movimientos
                      - strong [ref=e346]: "1"
                    - button "Con recurrentes 1" [ref=e347] [cursor=pointer]:
                      - generic [ref=e348]: Con recurrentes
                      - strong [ref=e349]: "1"
                    - button "Sin movimientos 3" [ref=e350] [cursor=pointer]:
                      - generic [ref=e351]: Sin movimientos
                      - strong [ref=e352]: "3"
                  - generic "Búsqueda de trabajadores" [ref=e353]:
                    - generic [ref=e354]:
                      - generic [ref=e355]: Buscar trabajador
                      - searchbox "Buscar trabajador" [ref=e356]
                  - generic [ref=e357]:
                    - generic "Listado de trabajadores" [ref=e359]:
                      - generic [ref=e360]:
                        - generic [ref=e362]:
                          - generic [ref=e364]:
                            - paragraph [ref=e365]: Listado de trabajadores
                            - generic [ref=e366]: · 4 trabajadores
                          - generic [ref=e367]:
                            - generic [ref=e368]:
                              - generic [ref=e369]: Mostrar
                              - combobox "Cantidad de elementos por pagina" [ref=e370]:
                                - option "25" [selected]
                                - option "50"
                                - option "100"
                            - button "Refrescar grilla" [ref=e371]:
                              - img [ref=e373]
                            - button "Configurar columnas visibles" [ref=e379]:
                              - img [ref=e381]
                        - table [ref=e386]:
                          - rowgroup [ref=e395]:
                            - row "N° Estado Trabajador Movimientos Incidencias Líquido estimado Acción" [ref=e396]:
                              - columnheader "N°" [ref=e397]
                              - columnheader "Estado" [ref=e398]:
                                - button "Estado" [ref=e399]:
                                  - generic [ref=e400]: Estado
                                  - img [ref=e402]
                              - columnheader "Trabajador" [ref=e405]:
                                - button "Trabajador" [ref=e406]:
                                  - generic [ref=e407]: Trabajador
                                  - img [ref=e409]
                              - columnheader "Movimientos" [ref=e412]:
                                - button "Movimientos" [ref=e413]:
                                  - generic [ref=e414]: Movimientos
                                  - img [ref=e416]
                              - columnheader "Incidencias" [ref=e419]:
                                - button "Incidencias" [ref=e420]:
                                  - generic [ref=e421]: Incidencias
                                  - img [ref=e423]
                              - columnheader "Líquido estimado" [ref=e426]:
                                - button "Líquido estimado" [ref=e427]:
                                  - generic [ref=e428]: Líquido estimado
                                  - img [ref=e430]
                              - columnheader "Acción" [ref=e433]:
                                - button "Acción" [ref=e434]:
                                  - generic [ref=e435]: Acción
                                  - img [ref=e437]
                          - rowgroup [ref=e440]:
                            - row "1 Listo Juan dasdasd Huerta 19.468.650-1 2 movimientos Sin incidencias $0 Ver detalle" [ref=e441]:
                              - cell "1" [ref=e442]
                              - cell "Listo" [ref=e443]:
                                - button "Listo" [ref=e445] [cursor=pointer]
                              - cell "Juan dasdasd Huerta 19.468.650-1" [ref=e446]:
                                - button "Juan dasdasd Huerta 19.468.650-1" [ref=e448] [cursor=pointer]:
                                  - generic [ref=e449]: Juan dasdasd Huerta
                                  - generic [ref=e450]: 19.468.650-1
                              - cell "2 movimientos" [ref=e451]:
                                - button "2 movimientos" [ref=e454] [cursor=pointer]
                              - cell "Sin incidencias" [ref=e455]:
                                - button "Sin incidencias" [ref=e457] [cursor=pointer]
                              - cell "$0" [ref=e458]:
                                - button "$0" [ref=e460] [cursor=pointer]
                              - cell "Ver detalle" [ref=e461]:
                                - button "Ver detalle" [ref=e463] [cursor=pointer]
                            - row "2 Listo NOMERR2405 Jornada Alta Legal QA 24.050.004-3 Sin movimientos Sin incidencias $0 Ver detalle" [ref=e464]:
                              - cell "2" [ref=e465]
                              - cell "Listo" [ref=e466]:
                                - button "Listo" [ref=e468] [cursor=pointer]
                              - cell "NOMERR2405 Jornada Alta Legal QA 24.050.004-3" [ref=e469]:
                                - button "NOMERR2405 Jornada Alta Legal QA 24.050.004-3" [ref=e471] [cursor=pointer]:
                                  - generic [ref=e472]: NOMERR2405 Jornada Alta Legal QA
                                  - generic [ref=e473]: 24.050.004-3
                              - cell "Sin movimientos" [ref=e474]:
                                - button "Sin movimientos" [ref=e477] [cursor=pointer]
                              - cell "Sin incidencias" [ref=e478]:
                                - button "Sin incidencias" [ref=e480] [cursor=pointer]
                              - cell "$0" [ref=e481]:
                                - button "$0" [ref=e483] [cursor=pointer]
                              - cell "Ver detalle" [ref=e484]:
                                - button "Ver detalle" [ref=e486] [cursor=pointer]
                            - row "3 Listo NOMERR2405 Sueldo Bajo IMM QA 24.050.003-5 Sin movimientos Sin incidencias $0 Ver detalle" [ref=e487]:
                              - cell "3" [ref=e488]
                              - cell "Listo" [ref=e489]:
                                - button "Listo" [ref=e491] [cursor=pointer]
                              - cell "NOMERR2405 Sueldo Bajo IMM QA 24.050.003-5" [ref=e492]:
                                - button "NOMERR2405 Sueldo Bajo IMM QA 24.050.003-5" [ref=e494] [cursor=pointer]:
                                  - generic [ref=e495]: NOMERR2405 Sueldo Bajo IMM QA
                                  - generic [ref=e496]: 24.050.003-5
                              - cell "Sin movimientos" [ref=e497]:
                                - button "Sin movimientos" [ref=e500] [cursor=pointer]
                              - cell "Sin incidencias" [ref=e501]:
                                - button "Sin incidencias" [ref=e503] [cursor=pointer]
                              - cell "$0" [ref=e504]:
                                - button "$0" [ref=e506] [cursor=pointer]
                              - cell "Ver detalle" [ref=e507]:
                                - button "Ver detalle" [ref=e509] [cursor=pointer]
                            - row "4 Listo NOMERR2405 Valido Calculo QA 24.050.001-9 Sin movimientos Sin incidencias $0 Ver detalle" [ref=e510]:
                              - cell "4" [ref=e511]
                              - cell "Listo" [ref=e512]:
                                - button "Listo" [ref=e514] [cursor=pointer]
                              - cell "NOMERR2405 Valido Calculo QA 24.050.001-9" [ref=e515]:
                                - button "NOMERR2405 Valido Calculo QA 24.050.001-9" [ref=e517] [cursor=pointer]:
                                  - generic [ref=e518]: NOMERR2405 Valido Calculo QA
                                  - generic [ref=e519]: 24.050.001-9
                              - cell "Sin movimientos" [ref=e520]:
                                - button "Sin movimientos" [ref=e523] [cursor=pointer]
                              - cell "Sin incidencias" [ref=e524]:
                                - button "Sin incidencias" [ref=e526] [cursor=pointer]
                              - cell "$0" [ref=e527]:
                                - button "$0" [ref=e529] [cursor=pointer]
                              - cell "Ver detalle" [ref=e530]:
                                - button "Ver detalle" [ref=e532] [cursor=pointer]
                        - generic [ref=e533]:
                          - paragraph [ref=e534]: Pagina 1 de 1
                          - generic [ref=e535]:
                            - generic "Paginacion inferior" [ref=e536]:
                              - button "Pagina anterior" [disabled] [ref=e537]:
                                - img [ref=e539]
                                - text: Atras
                              - generic "Pagina actual" [ref=e541]: 1 / 1
                              - button "Pagina siguiente" [disabled] [ref=e542]:
                                - text: Siguiente
                                - img [ref=e544]
                            - button "Ir a una pagina especifica" [ref=e547]: Ir a pagina
                    - complementary "Qué corregir del trabajador en la grilla" [ref=e548]:
                      - navigation "Secciones del detalle del trabajador" [ref=e549]:
                        - button "Atención" [ref=e550] [cursor=pointer]
                        - button "Resumen" [ref=e551] [cursor=pointer]
                      - generic [ref=e552]:
                        - generic [ref=e553]:
                          - term [ref=e554]: Estado
                          - definition [ref=e555]: Listo
                        - generic [ref=e556]:
                          - term [ref=e557]: Haberes
                          - definition [ref=e558]: $0
                        - generic [ref=e559]:
                          - term [ref=e560]: Descuentos
                          - definition [ref=e561]: $0
                        - generic [ref=e562]:
                          - term [ref=e563]: Líquido estimado
                          - definition [ref=e564]: $0
                      - region "Movimientos del período" [ref=e565]:
                        - heading "Movimientos del período" [level=4] [ref=e566]
                        - button "Ver 2 movimientos" [ref=e567] [cursor=pointer]
```

# Test source

```ts
  53  |   const config = loadAppConfig();
  54  |   const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  55  |   const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  56  |   const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  57  |     auth: {
  58  |       persistSession: false,
  59  |       autoRefreshToken: false,
  60  |       storageKey: 'angular-erp-auth',
  61  |     },
  62  |   });
  63  | 
  64  |   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  65  |   expect(error, 'No se pudo iniciar sesion authenticated para E2E de nomina real.').toBeNull();
  66  |   expect(data.session, 'Supabase no devolvio sesion authenticated para E2E de nomina real.').not.toBeNull();
  67  | 
  68  |   return supabase;
  69  | }
  70  | 
  71  | async function loginThroughUi(page: Page): Promise<void> {
  72  |   const email = process.env['E2E_SUPABASE_AUTH_EMAIL'] ?? '';
  73  |   const password = process.env['E2E_SUPABASE_AUTH_PASSWORD'] ?? '';
  74  | 
  75  |   await page.goto('/login?returnUrl=/remuneraciones/proceso-mensual');
  76  |   await expect(page.getByRole('heading', { name: 'Iniciar sesion' })).toBeVisible();
  77  |   await page.locator('#login-email').fill(email);
  78  |   await page.locator('#login-password').fill(password);
  79  |   await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  80  |   await page.waitForURL('**/remuneraciones/proceso-mensual', { timeout: 60_000 });
  81  |   await expect(page.getByText(/Sesi[oó]n activa|N[oó]mina mensual|Proceso mensual/i).first()).toBeVisible({ timeout: 30_000 });
  82  | }
  83  | 
  84  | async function clickAndWaitIdle(page: Page, name: RegExp | string): Promise<void> {
  85  |   await page.getByRole('button', { name }).first().click();
  86  |   await page.waitForLoadState('networkidle');
  87  | }
  88  | 
  89  | async function countRows(supabase: SupabaseClient, table: string, idCalculoPeriodo: number): Promise<number> {
  90  |   const { count, error } = await supabase
  91  |     .from(table)
  92  |     .select('*', { count: 'exact', head: true })
  93  |     .eq('id_calculo_periodo', idCalculoPeriodo);
  94  |   expect(error, `No se pudo contar ${table}.`).toBeNull();
  95  |   return count ?? 0;
  96  | }
  97  | 
  98  | async function countConceptos(supabase: SupabaseClient, idCalculoPeriodo: number): Promise<number> {
  99  |   const { data: trabajadores, error: trabajadoresError } = await supabase
  100 |     .from('nomina_calculo_trabajador')
  101 |     .select('id_calculo_trabajador')
  102 |     .eq('id_calculo_periodo', idCalculoPeriodo);
  103 |   expect(trabajadoresError, 'No se pudieron leer trabajadores para contar conceptos.').toBeNull();
  104 | 
  105 |   const trabajadorIds = (trabajadores ?? []).map((row: { id_calculo_trabajador: number }) => row.id_calculo_trabajador);
  106 |   expect(trabajadorIds.length).toBeGreaterThan(0);
  107 | 
  108 |   const { count, error } = await supabase
  109 |     .from('nomina_calculo_concepto')
  110 |     .select('*', { count: 'exact', head: true })
  111 |     .in('id_calculo_trabajador', trabajadorIds);
  112 |   expect(error, 'No se pudieron contar conceptos del snapshot.').toBeNull();
  113 |   return count ?? 0;
  114 | }
  115 | 
  116 | function cierreOperativoVisible(page: Page) {
  117 |   return page.getByRole('heading', { name: 'Nómina mensual confirmada' });
  118 | }
  119 | 
  120 | describeNominaReal('nomina mensual - E2E real authenticated', () => {
  121 |   test.describe.configure({ mode: 'serial', timeout: 300_000 });
  122 | 
  123 |   test('Nómina mensual: verifica, genera, revisa, confirma y recupera al recargar', async ({ page }, testInfo) => {
  124 |     const periodo = process.env['E2E_NOMINA_PERIODO'] ?? '';
  125 |     const consoleErrors: string[] = [];
  126 |     const rpcResponses: string[] = [];
  127 |     page.on('console', (message) => {
  128 |       if (message.type() === 'error') {
  129 |         consoleErrors.push(message.text());
  130 |       }
  131 |     });
  132 |     page.on('pageerror', (error) => {
  133 |       consoleErrors.push(error.message);
  134 |     });
  135 |     page.on('response', async (response) => {
  136 |       if (!response.url().includes('/rpc/guardar_nomina_calculo_snapshot')) return;
  137 |       let body = '';
  138 |       try {
  139 |         body = await response.text();
  140 |       } catch {
  141 |         body = 'No se pudo leer el cuerpo de la respuesta RPC.';
  142 |       }
  143 |       rpcResponses.push(`status=${response.status()}\n${body}`);
  144 |     });
  145 | 
  146 |     try {
  147 |       await loginThroughUi(page);
  148 |       const supabase = await createAuthenticatedClient();
  149 | 
  150 |       page.on('dialog', (dialog) => dialog.accept());
  151 | 
  152 |       await expect(page.getByRole('heading', { name: 'Nómina mensual' })).toBeVisible();
> 153 |       await page.locator('#pm-periodo').fill(periodo);
      |                                         ^ Error: locator.fill: Test timeout of 300000ms exceeded.
  154 |       await clickAndWaitIdle(page, /Verificar período/);
  155 |       await expect(page.getByText('Estado para calculo preliminar')).toBeVisible({ timeout: 60_000 });
  156 | 
  157 |       if (runNominaCierreReal) {
  158 |         const { data: existingRows, error: existingError } = await supabase
  159 |           .from('nomina_calculo_periodo')
  160 |           .select('id_calculo_periodo,cierre_operativo_estado,cierre_operativo_fecha')
  161 |           .eq('periodo', periodo)
  162 |           .eq('activo', true)
  163 |           .is('reemplazado_por', null)
  164 |           .order('created_at', { ascending: false });
  165 |         expect(existingError).toBeNull();
  166 |         const existingClosed = (existingRows ?? [])[0]?.cierre_operativo_estado === 'cerrado_operativamente';
  167 |         if (existingClosed) {
  168 |           await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
  169 |           await expect(page.getByRole('button', { name: /Revisar trabajadores/ }).first()).toBeDisabled();
  170 |           await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeDisabled();
  171 |           await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeDisabled();
  172 |           await page.reload();
  173 |           await page.locator('#pm-periodo').fill(periodo);
  174 |           await clickAndWaitIdle(page, /Verificar período/);
  175 |           await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
  176 |           return;
  177 |         }
  178 |       }
  179 | 
  180 |       await expect(page.getByRole('button', { name: /Generar nómina/ }).first()).toBeEnabled({
  181 |         timeout: 60_000,
  182 |       });
  183 |       await clickAndWaitIdle(page, /Generar nómina/);
  184 |       await expect(page.getByRole('heading', { name: 'Base de nomina' })).toBeVisible({ timeout: 60_000 });
  185 | 
  186 |       await expect(page.getByRole('button', { name: /Revisar trabajadores/ }).first()).toBeEnabled({ timeout: 60_000 });
  187 |       await clickAndWaitIdle(page, /Revisar trabajadores/);
  188 |       await expect(page.getByText('Nómina en revisión', { exact: true })).toBeVisible({ timeout: 60_000 });
  189 | 
  190 |       await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeEnabled({
  191 |         timeout: 60_000,
  192 |       });
  193 |       await page.getByRole('button', { name: /Confirmar nómina/ }).first().click();
  194 |       await expect(
  195 |         page.getByText(
  196 |           'Nómina mensual disponible para revisión.',
  197 |         ),
  198 |       ).toBeVisible({ timeout: 90_000 });
  199 |       await expect(page.getByText('Nómina mensual disponible desde BD')).toBeVisible({ timeout: 90_000 });
  200 | 
  201 |       const { data: rows, error: snapshotError } = await supabase
  202 |         .from('nomina_calculo_periodo')
  203 |         .select(
  204 |           'id_calculo_periodo,periodo,activo,reemplazado_por,total_trabajadores,total_haberes,total_descuentos,total_liquido,total_bloqueados,total_advertencias,aprobacion_operativa_estado,aprobacion_operativa_fecha,aprobacion_operativa_usuario_id,aprobacion_operativa_usuario_label',
  205 |         )
  206 |         .eq('periodo', periodo)
  207 |         .order('created_at', { ascending: false });
  208 |       expect(snapshotError).toBeNull();
  209 |       const snapshotRows = (rows ?? []) as NominaPeriodoRow[];
  210 |       const activeRows = snapshotRows.filter((row) => row.activo);
  211 |       expect(activeRows).toHaveLength(1);
  212 |       expect(activeRows[0].total_trabajadores).toBeGreaterThan(0);
  213 | 
  214 |       const activeId = activeRows[0].id_calculo_periodo;
  215 |       await expect.poll(() => countRows(supabase, 'nomina_calculo_trabajador', activeId)).toBeGreaterThan(0);
  216 |       await expect.poll(() => countConceptos(supabase, activeId)).toBeGreaterThan(0);
  217 |       await expect.poll(() => countRows(supabase, 'nomina_calculo_trazabilidad', activeId)).toBeGreaterThan(0);
  218 | 
  219 |       await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeEnabled({
  220 |         timeout: 60_000,
  221 |       });
  222 |       await page.getByRole('button', { name: /Confirmar nómina/ }).click();
  223 |       await expect(page.getByRole('heading', { name: /Confirmar nómina/i })).toBeVisible({ timeout: 60_000 });
  224 |       await expect(page.getByText('Nómina mensual confirmada.', { exact: true })).toBeVisible({
  225 |         timeout: 60_000,
  226 |       });
  227 | 
  228 |       const { data: approved, error: approvedError } = await supabase
  229 |         .from('nomina_calculo_periodo')
  230 |         .select('id_calculo_periodo,aprobacion_operativa_estado,aprobacion_operativa_fecha')
  231 |         .eq('id_calculo_periodo', activeId)
  232 |         .maybeSingle();
  233 |       expect(approvedError).toBeNull();
  234 |       expect(approved?.aprobacion_operativa_estado).toBe('aprobado_operativamente');
  235 |       expect(approved?.aprobacion_operativa_fecha).toBeTruthy();
  236 | 
  237 |       await expect(page.getByRole('heading', { name: 'Cierre operativo' })).toBeVisible({ timeout: 60_000 });
  238 |       if (runNominaCierreReal) {
  239 |         const { data: cierrePrevio, error: cierrePrevioError } = await supabase
  240 |           .from('nomina_calculo_periodo')
  241 |           .select('cierre_operativo_estado,cierre_operativo_fecha')
  242 |           .eq('id_calculo_periodo', activeId)
  243 |           .maybeSingle();
  244 |         expect(cierrePrevioError).toBeNull();
  245 | 
  246 |         if (cierrePrevio?.cierre_operativo_estado !== 'cerrado_operativamente') {
  247 |           await expect(page.getByRole('button', { name: /Confirmar nómina/ }).first()).toBeEnabled({
  248 |             timeout: 60_000,
  249 |           });
  250 |           await page.getByRole('button', { name: /Confirmar nómina/ }).click();
  251 |           await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
  252 |         } else {
  253 |           await expect(cierreOperativoVisible(page)).toBeVisible({ timeout: 60_000 });
```