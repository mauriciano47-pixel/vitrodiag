// --- CATÁLOGO DE DEFECTOS: ZONAS BOCA Y CUELLO (MÁQUINAS I.S.) ---
export const DEFECTOS_BOCA_CUELLO = [
            // --- BOCA ---
            {
                id: "calcinado_boca",
                nombre: "Calcinado en Boca / Grasa de Corona (Carbon Finish / Black Spot)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Incrustación o mancha negra de compuesto de grafito/carbón calcinado en la cara de sellado o en los hilos de la rosca de la boca. Compromete el hermetismo, contamina el producto envasado y es motivo de rechazo automático en línea fría.",
                causas: [
                    "Exceso de compuesto de lubricación (swabbing) en el macho de prensado o en el molde de boca.",
                    "Pasta de swabbing degradada o con exceso de grafito en suspensión que se quema al contacto con el vidrio caliente.",
                    "Hisopo gastado o mal escurrido que gotea sobre el anillo de guía o platina de boca."
                ],
                acciones: [
                    "Limpiar minuciosamente el molde de boca y la punta del macho con trapo seco para eliminar costras de carbón.",
                    "Reducir la cantidad de pasta de swabbing y espaciar los ciclos de lubricación.",
                    "Soplar aire de purga en la sección tras el hisopeado y verificar que el hisopo esté en buen estado."
                ]
            },
            {
                id: "rebaba_boca",
                nombre: "Rebaba en la Boca (Overpressed Finish)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Exceso de vidrio proyectado hacia arriba o a los lados en la cara de sellado de la boca, resultando en un borde filoso que puede causar cortes al consumidor o fugas en el taponado.",
                causas: [
                    "Sobrepeso persistente en la gota de vidrio fundido.",
                    "El macho de prensar (plunger) está desalineado o sube con exceso de fuerza.",
                    "El anillo de guía o el molde de boca están gastados, sucios o mal encastrados."
                ],
                acciones: [
                    "Reducir el peso de la gota regulando el tubo o aguja en el alimentador.",
                    "Disminuir la presión del aire de prensado o retardar el tiempo de plunger ON.",
                    "Cambiar o limpiar las platinas y la moldería de boca."
                ]
            },
            {
                id: "bajo_boca",
                nombre: "Boca Incompleta (Underfilled Finish / Bajo Boca)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Falta de vidrio en el contorno superior de la boca. La rosca o la cara de sellado quedan incompletas, impidiendo el correcto hermetismo del envase.",
                causas: [
                    "Gota de vidrio con peso inferior al rango nominal.",
                    "Presión de vacío de boca (Vacuum Fill) muy baja o nula.",
                    "Macho de prensar trabajando excesivamente frío o con carrera muy corta."
                ],
                acciones: [
                    "Aumentar el peso de la gota en el alimentador.",
                    "Verificar y aumentar la presión de vacío de boca en la sección.",
                    "Calentar el macho de la sección o aumentar la presión de aire de prensado."
                ]
            },
            {
                id: "grieta_boca",
                nombre: "Grieta en la Boca (Corkage Check)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Fisuras pequeñas en la parte interna o externa del labio de la boca. Suelen ser transparentes y difíciles de detectar a simple vista, pero debilitan la boca.",
                causas: [
                    "Choque térmico drástico debido a enfriamiento de boca excesivo.",
                    "Contacto violento del mecanismo de las pinzas de traspaso (Takeout).",
                    "El macho de prensado está muy frío en relación con el vidrio."
                ],
                acciones: [
                    "Disminuir la presión del enfriamiento de la moldería de boca.",
                    "Ajustar las pinzas del takeout para evitar golpear el envase recién formado.",
                    "Controlar la temperatura de los machos (swabbing correcto o menor aire interno)."
                ]
            },
            {
                id: "boca_inclinada",
                nombre: "Boca Inclinada (Crooked Finish)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "La boca está inclinada respecto al eje vertical de la botella, lo cual afecta el roscado automático.",
                causas: [
                    "Enfriamiento deficiente de la boca antes del traspaso.",
                    "El mecanismo de inversión (Invert) trabaja a velocidad excesiva.",
                    "Exceso de calor en el vidrio del parison."
                ],
                acciones: [
                    "Aumentar el tiempo o caudal de enfriamiento en el molde de boca.",
                    "Suavizar el movimiento del cilindro de inversión ajustando las válvulas amortiguadoras.",
                    "Reducir la temperatura global del alimentador de vidrio."
                ]
            },
            {
                id: "boca_hinchada",
                nombre: "Boca Hinchada (Bulged Finish)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "El diámetro externo de la boca está sobredimensionado debido a deformación plástica posterior al prensado.",
                causas: [
                    "Vidrio del cuello demasiado caliente.",
                    "Presión interna de aire aplicada antes de que la boca esté lo suficientemente fría.",
                    "Falta de enfriamiento local."
                ],
                acciones: [
                    "Incrementar el flujo de aire de enfriamiento al molde de boca.",
                    "Ajustar los tiempos de soplado (Settle Blow / Blow Back) para enfriar el parison."
                ]
            },
            {
                id: "rosca_partida",
                nombre: "Rosca Partida (Split Thread)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Fisura o rotura en los hilos de la rosca del envase que impide un taponado firme.",
                causas: [
                    "El molde de boca abre de forma brusca o descalibrada.",
                    "El vidrio se adhiere a la rosca del molde por falta de lubricación."
                ],
                acciones: [
                    "Ajustar la apertura y alineación de los brazos del molde de boca.",
                    "Realizar un hisopeado (swabbing) limpio en la zona de la rosca."
                ]
            },
            {
                id: "boca_excentrica",
                nombre: "Boca Excéntrica (Offset Finish)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "La boca de la botella no está centrada con respecto al eje del cuerpo, viéndose desplazada lateralmente.",
                causas: [
                    "Los brazos del molde de boca no cierran simétricamente.",
                    "Holguras mecánicas severas en el cabezal de inversión de la sección."
                ],
                acciones: [
                    "Corregir el desgaste mecánico de los brazos porta-moldes.",
                    "Ajustar el alineado y la carrera de los mecanismos de la sección."
                ]
            },
            {
                id: "marcas_vacio",
                nombre: "Marcas de Vacío en Boca (Vacuum Marks)",
                zona: "boca",
                gravedad: "Menor",
                descripcion: "Líneas o arrugas en la superficie de la boca. Es un defecto estético común originado por la succión.",
                causas: [
                    "Aplicación del vacío de boca demasiado temprano.",
                    "Acople imperfecto entre la platina y el molde de boca."
                ],
                acciones: [
                    "Ajustar el tiempo de vacío para que comience exactamente con la caída de la gota.",
                    "Revisar el estado físico de la junta y platinas."
                ]
            },
            {
                id: "rosca_incompleta",
                nombre: "Rosca Incompleta (Unfilled Thread)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Falta de vidrio en el contorno del hilo de la rosca, lo cual debilita el cierre metálico o plástico de la tapa.",
                causas: [
                    "Insuficiente presión de aire durante el settle blow.",
                    "Vidrio frío en la punta de la gota o mala distribución de temperatura.",
                    "Desgaste físico o suciedad en las cavidades del molde de boca."
                ],
                acciones: [
                    "Incrementar la presión de aire del settle blow.",
                    "Ajustar la temperatura de los quemadores de canal para homogeneizar el vidrio.",
                    "Limpiar y sopletear la moldería de boca."
                ]
            },
            {
                id: "grieta_interna_boca",
                nombre: "Boca Fisurada Interna (Inside Corkage Check)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Fisura en el interior del orificio de la boca del envase, que puede desprender astillas de vidrio al introducir un corcho o cánula.",
                causas: [
                    "El macho de prensar (plunger) está descalibrado, frío o roza fuertemente contra el orificio.",
                    "Contacto drástico térmico al enfriar el punzón."
                ],
                acciones: [
                    "Centrar y alinear el cilindro de machos de la sección.",
                    "Reducir el caudal de aire de enfriamiento del macho."
                ]
            },
            {
                id: "boca_astillada",
                nombre: "Boca Astillada (Chipped Finish)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Falta un fragmento de vidrio en la cara de sellado o rosca de la boca, comúnmente causado por golpes mecánicos.",
                causas: [
                    "Apertura brusca del molde de boca o del mecanismo de inversión.",
                    "Golpes de la botella caliente contra los deflectores o transportadores debido a mala sincronía."
                ],
                acciones: [
                    "Verificar y amortiguar los movimientos de inversión y apertura.",
                    "Sincronizar la velocidad de los empujadores en la salida."
                ]
            },
            {
                id: "rosca_desalineada",
                nombre: "Rosca Desalineada (Mismatched Thread)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Los hilos de la rosca muestran un escalón o desfase horizontal en la línea de costura del molde de boca.",
                causas: [
                    "Los brazos del molde de boca cierran desalineados por holgura mecánica.",
                    "Diferencia dimensional o desgaste en las platinas de cuello."
                ],
                acciones: [
                    "Ajustar y calibrar el juego en las bisagras porta-moldes.",
                    "Reemplazar platinas y alinear la moldería."
                ]
            },
            {
                id: "linea_sobre_boca",
                nombre: "Línea sobre la Boca (Line Over Sealing Surface)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Una ranura o línea delgada horizontal que cruza la cara de sellado de la boca, provocando fugas de gas o líquido.",
                causas: [
                    "Marca originada por rasguño o daño físico en el macho o platinas.",
                    "Vidrio frío acumulado que no se fundió completamente."
                ],
                acciones: [
                    "Reemplazar el macho de la sección por uno pulido.",
                    "Subir temperatura en la gota de vidrio."
                ]
            },
            {
                id: "rosca_chata",
                nombre: "Rosca Chata / Cara Plana (Flat Sealing Surface)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "La cara superior de sellado de la boca presenta una zona achatada o hundida que no permite el contacto uniforme con la junta de la tapa.",
                causas: [
                    "Presión insuficiente del aire de settle blow en el premolde.",
                    "Macho de prensar gastado o desalineado."
                ],
                acciones: [
                    "Aumentar el tiempo o la presión del settle blow.",
                    "Verificar y cambiar el macho si su cara de asiento está plana o deformada."
                ]
            },
            {
                id: "boca_ondulada",
                nombre: "Boca Ondulada (Wavy Finish)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "La superficie superior de la boca no es plana y horizontal, sino que presenta ondulaciones que provocan pérdidas de hermeticidad.",
                causas: [
                    "Enfriamiento de boca desigual en el premolde.",
                    "La gota cae de lado impidiendo que el vidrio llene el molde uniformemente."
                ],
                acciones: [
                    "Ajustar y alinear la entrega de la gota en el embudo.",
                    "Revisar el caudal de aire de enfriamiento del molde de boca."
                ]
            },
            {
                id: "boca_escamada",
                nombre: "Boca Escamada (Scaly Finish / Crazing)",
                zona: "boca",
                gravedad: "Menor",
                descripcion: "Microfisuras superficiales en el vidrio del anillo de boca que le dan un aspecto áspero o escamoso.",
                causas: [
                    "Moldería de boca excesivamente fría en el ciclo.",
                    "Hisopeado con desmoldante que contiene trazas de agua."
                ],
                acciones: [
                    "Reducir el caudal de enfriamiento del molde de boca.",
                    "Asegurar que el lubricante y el hisopo estén limpios y libres de agua."
                ]
            },
            {
                id: "split_finish_radial",
                nombre: "Fisura Radial de Boca (Split Finish - Radial)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Fisura fina y lineal que se propaga radialmente desde el orificio interno de la boca hacia el exterior de la rosca.",
                causas: [
                    "El macho de prensado roza de lado la pared interna del molde de boca.",
                    "Traspaso (Invert) violento o mal amortiguado."
                ],
                acciones: [
                    "Centrar perfectamente el mecanismo del plunger.",
                    "Ajustar la amortiguación del cilindro de inversión."
                ]
            },
            {
                id: "marca_cizalla_boca",
                nombre: "Marca de Cizalla en Boca (Shear Mark on Finish)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Línea o corte en la superficie de sellado superior de la boca, originado por una gota de vidrio mal cortada.",
                causas: [
                    "Las cuchillas de la cizalla están desafiladas u oxidadas.",
                    "Mala sincronía en el corte de la gota."
                ],
                acciones: [
                    "Cambiar o rectificar el filo de las cuchillas.",
                    "Sincronizar el ciclo de corte del alimentador."
                ]
            },
            {
                id: "boca_incompleta_bead",
                nombre: "Anillo de Boca Incompleto (Underfilled Bead)",
                zona: "boca",
                gravedad: "Mayor",
                descripcion: "Falta de llenado de vidrio en el labio o anillo inferior del perfil de la boca.",
                causas: [
                    "Aire atrapado por vacío de boca deficiente.",
                    "Poca presión de soplado inicial."
                ],
                acciones: [
                    "Asegurar el correcto funcionamiento de las líneas de vacío de la sección.",
                    "Incrementar soplado inicial."
                ]
            },
            {
                id: "grieta_vert_boca",
                nombre: "Grieta Vertical de Boca (Vertical Split Finish)",
                zona: "boca",
                gravedad: "Crítico",
                descripcion: "Fisura vertical completa en los hilos de la rosca del envase.",
                causas: [
                    "El molde de boca se abre con excesiva violencia.",
                    "Falta de lubricación en las platinas."
                ],
                acciones: [
                    "Regular la amortiguación del mecanismo de apertura de cuello.",
                    "Hisopar las platinas regularmente."
                ]
            },

            // --- CUELLO ---
            {
                id: "calcinado_cuello",
                nombre: "Calcinado en Cuello (Carbon Neck Mark)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "Manchas oscuras, vetas de carbón o partículas negras de lubricante quemado adheridas en la zona interna o externa del cuello de la botella.",
                causas: [
                    "Arrastre de pasta de swabbing acumulada en la parte superior del pre-molde durante el asentamiento.",
                    "Lubricación excesiva en los brazos de inversión (Invert) o anillo de cuello.",
                    "Falta de ventilación en la zona de cuello que atrapa vapores de aceite quemado."
                ],
                acciones: [
                    "Limpiar la zona de asiento del pre-molde y retirar costras de grafito acumuladas.",
                    "Ajustar la técnica de hisopeado aplicando una película delgada y uniforme sin escurrimientos.",
                    "Verificar el enfriamiento y purga de aire en la estación de pre-molde."
                ]
            },
            {
                id: "cuello_doblado",
                nombre: "Cuello Doblado (Bent Neck)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "El cuello de la botella se dobla ligeramente hacia un lado después de salir del molde final.",
                causas: [
                    "Parison o cuello demasiado caliente al desmoldar.",
                    "Las pinzas de traspaso jalan de lado o están mal alineadas con el molde final.",
                    "Tiempo de soplado final demasiado corto."
                ],
                acciones: [
                    "Aumentar el enfriamiento del cuello o del molde final.",
                    "Verificar el centrado y la velocidad del takeout.",
                    "Ajustar el soplado final para enfriar la estructura interna."
                ]
            },
            {
                id: "costura_cuello_alta",
                nombre: "Costura de Cuello Alta (High Neck Seam)",
                zona: "cuello",
                gravedad: "Menor",
                descripcion: "Un relieve de vidrio pronunciado que sobresale en la línea de unión vertical de los moldes de cuello.",
                causas: [
                    "Los moldes de cuello no cierran herméticamente.",
                    "Presión de cierre de moldes de la sección muy débil."
                ],
                acciones: [
                    "Limpiar los encastres de las hojas del molde.",
                    "Incrementar la presión en el cilindro de cierre de moldes."
                ]
            },
            {
                id: "estrias_cuello",
                nombre: "Estrías en el Cuello (Neck Ring Laps)",
                zona: "cuello",
                gravedad: "Menor",
                descripcion: "Ondas concéntricas o arrugas horizontales en la superficie del cuello del envase.",
                causas: [
                    "Gota de vidrio ingresando fría en la zona superior.",
                    "Lubricante excesivo o muy concentrado en el molde de boca."
                ],
                acciones: [
                    "Ajustar la temperatura en el canal y boquillas.",
                    "Lubricar de forma más fina y espaciada."
                ]
            },
            {
                id: "cuello_obstruido",
                nombre: "Cuello Obstruido / Estrecho (Choked Neck)",
                zona: "cuello",
                gravedad: "Crítico",
                descripcion: "Reducción del diámetro interno del cuello del envase que impide el paso de la cánula de llenado o del corcho.",
                causas: [
                    "Vidrio caliente acumulado en la zona del cuello que colapsa hacia adentro.",
                    "Exceso de soplado o re-calentamiento prolongado del parison."
                ],
                acciones: [
                    "Disminuir la temperatura del vidrio.",
                    "Optimizar el tiempo de recalentamiento reduciendo el retardo del soplado final."
                ]
            },
            {
                id: "anillo_excentrico",
                nombre: "Anillo de Boca Excéntrico (Offset Neck Ring)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "La moldería de cuello y boca no está alineada concéntricamente con el hombro, dejando un escalón visible.",
                causas: [
                    "El cabezal de inversión o los brazos porta-moldes tienen desalineamiento físico.",
                    "Instalación incorrecta de la moldería."
                ],
                acciones: [
                    "Calibrar y ajustar la concentricidad del cabezal inversor.",
                    "Revisar el encastre del molde de boca con los premoldes."
                ]
            },
            {
                id: "pliegue_cuello",
                nombre: "Pliegue de Cuello (Neck Fold)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "Arruga o doblez de vidrio en el exterior del cuello producido por un parison que colapsó antes del soplado.",
                causas: [
                    "Recalentamiento excesivo del cuello en el traspaso.",
                    "El parison es demasiado largo y se dobla por su propio peso."
                ],
                acciones: [
                    "Aumentar enfriamiento local al parison.",
                    "Reducir el tiempo de recalentamiento adelantando el soplado final."
                ]
            },
            {
                id: "garganta_cerrada",
                nombre: "Garganta Cerrada (Choked Bore)",
                zona: "cuello",
                gravedad: "Crítico",
                descripcion: "El diámetro interno del orificio está obstruido por una costra o burbuja de vidrio fundido.",
                causas: [
                    "El macho sube descentrado dañando las paredes internas.",
                    "Gota de vidrio excesivamente caliente que se expande hacia adentro."
                ],
                acciones: [
                    "Centrar los machos and verificar la carrera del cilindro.",
                    "Controlar la temperatura del vidrio en el canal."
                ]
            },
            {
                id: "costura_anillo_desfasada",
                nombre: "Costura del Anillo Desfasada (Offset Neck Ring Seam)",
                zona: "cuello",
                gravedad: "Menor",
                descripcion: "Desalineamiento horizontal visible entre la junta del molde final y el anillo de cuello.",
                causas: [
                    "Pernos guía o encastres del soporte de cuello desgastados.",
                    "Macho de la sección empujando fuera de eje."
                ],
                acciones: [
                    "Reemplazar los pernos de alineación y guías.",
                    "Centrar el pistón del macho."
                ]
            },
            {
                id: "cuello_estirado",
                nombre: "Cuello Estirado (Stretched Neck)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "La longitud del cuello es superior a la especificación debido a un estiramiento mecánico cuando el vidrio aún estaba muy maleable.",
                causas: [
                    "Vidrio de cuello excesivamente caliente.",
                    "El mecanismo de takeout extrae el envase con un jalón muy rápido."
                ],
                acciones: [
                    "Aumentar el enfriamiento de moldes en la zona del cuello.",
                    "Suavizar el arranque y temporización del cilindro de takeout."
                ]
            },
            {
                id: "cuello_fisurado_ext",
                nombre: "Cuello Fisurado Exterior (Exterior Neck Check)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "Grieta externa transparente localizada en el exterior del cuello, cerca del hombro.",
                causas: [
                    "El molde de cuello está demasiado frío.",
                    "Las hojas del molde final golpean el cuello al cerrar."
                ],
                acciones: [
                    "Reducir el caudal de enfriamiento del molde.",
                    "Ajustar amortiguadores de cierre de molde final."
                ]
            },
            {
                id: "perdida_diametro_cuello",
                nombre: "Pérdida de Diámetro en Cuello (Choked Neck - Ring)",
                zona: "cuello",
                gravedad: "Crítico",
                descripcion: "Estrechamiento del orificio del cuello justo debajo del labio de la boca.",
                causas: [
                    "Macho de prensado muy caliente o lubricación en exceso que expande el parison en esa zona antes del soplado."
                ],
                acciones: [
                    "Aumentar el enfriamiento interno del macho.",
                    "Reducir la lubricación del macho."
                ]
            },
            {
                id: "platina_fria",
                nombre: "Marca de Platina Fría (Cold Neck Ring Mark)",
                zona: "cuello",
                gravedad: "Mayor",
                descripcion: "Relieve irregular en el cuello originado por el contacto directo con una platina muy fría en el ciclo.",
                causas: [
                    "Falta de precalentamiento en la platina de cuello al arrancar la sección.",
                    "Caudal de aire de enfriamiento desmedido."
                ],
                acciones: [
                    "Precalentar las platinas antes de operar.",
                    "Reducir el caudal del aire."
                ]
            },
            {
                id: "desgaste_molde_cuello",
                nombre: "Desgaste del Encastre del Cuello (Mismatched Joint Line)",
                zona: "cuello",
                gravedad: "Menor",
                descripcion: "Línea de costura muy pronunciada en la unión entre el cuello y la boca.",
                causas: [
                    "La platina de cuello está mal acoplada con el molde final.",
                    "Suciedad en la junta."
                ],
                acciones: [
                    "Limpiar y raspar las caras de encastre.",
                    "Alinear el cabezal de inversión."
                ]
            },
// === DEFECTOS OFICIALES CRISTALERÍAS DE CHILE S.A. (BOCA Y CUELLO) ===
    {
        id: "columpio_cuello",
        nombre: "Columpio Cuello / Boca (Stuck Plunger / Neck Birdswing)",
        zona: "cuello",
        gravedad: "Crítico",
        descripcion: "Presencia de un hilo o filamento de vidrio adherido en sus extremos a las paredes internas del cuello o del inicio de la boca del envase (queda suspendido en el interior). Defecto crítico de seguridad alimentaria (AQL 0.0%) que exige rechazo inmediato en caliente.",
        causas: [
            "Macho o punzón trabajando caliente o con recubrimiento de Colmonoy desgastado en la punta.",
            "Perforaciones del macho para el contrasoplo tapadas o con vidrio incrustado.",
            "Temporización de contrasoplo incorrecta o tardía.",
            "Pérdida de vacío en la platina antes de la carga de la gota.",
            "Equipo de moldería de la boca sucio o con exceso de carbón.",
            "Macho arriba 'OFF' desfasado respecto a la tapa."
        ],
        acciones: [
            "Aplicar contrasoplo de baja presión (~2 psi) con duración de 3° a 5° tan pronto como el macho baja (trabajar entre 80° y 85°).",
            "En máquinas sin baja presión, usar 'Puff' con el contrasoplo de alta con 1° a 2° de duración (entre 80° y 81°).",
            "Macho arriba 'OFF' debe estar 10° después de la tapa 'OFF' (mínimo 5°).",
            "Vacío de boca 'OFF' debe ser igual o menor que la tapa 'OFF' e inicio 'ON' tan pronto como carga la gota en el parisón.",
            "Usar modo SWAB al lubricar platinas para rechazar automáticamente de 1 a 3 ciclos.",
            "Si sale columpio en la sección, rechazar inmediatamente en caliente y avisar urgente a Jefe de Línea / Encargado de Planta."
        ]
    },
    {
        id: "calcinado_gollete",
        nombre: "Calcinado Gollete (Check Under the Bead)",
        zona: "cuello",
        gravedad: "Crítico",
        descripcion: "Fractura superficial de longitud variable ubicada en la zona del gollete, con orientación horizontal localizada directamente bajo el encastre de la platina (bajo la moldura o bead). No penetra al interior pero debilita críticamente la corona.",
        causas: [
            "Calibración del porta platinas desnivelado o inclinado (lado premolde o molde).",
            "Enfriamiento excesivo de la platina.",
            "Movimiento de inversión y amortiguación del porta platinas inadecuado o violento.",
            "Velocidad excesiva de la tapa abajo o apertura de premolde demasiado rápida.",
            "Bisagra de premolde, bieletas y pasadores gastados con holgura.",
            "Altura incorrecta del mecanismo de machos en la entrega."
        ],
        acciones: [
            "Nivelar y alinear el porta platinas sobre la línea central del molde (tolerancia 1/16\").",
            "Regular la amortiguación del cilindro de inversión para eliminar rebotes.",
            "Reducir el enfriamiento de la platina si está trabajando excesivamente fría.",
            "Inspeccionar y reemplazar pasadores y bieletas gastadas de la bisagra de premolde.",
            "Verificar radio y holgura de encastre parison-platina en el cuello del molde."
        ]
    },
    {
        id: "calcinado_vertical_boca",
        nombre: "Calcinado Vertical Boca (Split Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Fractura que atraviesa verticalmente la superficie superior de la boca y se extiende hacia abajo en dirección al cuello. Debilita estructuralmente la boca y compromete totalmente el sellado hermético.",
        causas: [
            "Cilindro de machos desalineado o macho suelto.",
            "Soplado de asentamiento excesivo en tiempo o presión.",
            "Enfriamiento inapropiado o excesivo del macho y de la platina (trabajan fríos).",
            "Tiempo de contacto del macho excesivo.",
            "Presión excesiva de prensado del macho en proceso prensado-soplado (NNPB).",
            "Punta fría en la gota de vidrio por mal corte de tijeras o pulverizado excesivo."
        ],
        acciones: [
            "Centrar y alinear el cilindro de machos y verificar apriete de fijación.",
            "Reducir presión y tiempo del soplado de asentamiento.",
            "Ajustar refrigeración de machos y platinas para evitar enfriamiento térmico violento.",
            "En NNPB: regular presión de prensado y carrera del punzón.",
            "Alinear tijeras del alimentador y ajustar pulverizado de cuchillas."
        ]
    },
    {
        id: "emboquillado",
        nombre: "Emboquillado (Blow Back)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Pestaña o saliente de vidrio fino en el interior del inicio de la boca que se forma de abajo hacia arriba. En boca tipo corcho impide el ingreso del tapón y en boca rosca destruye el sello hermético.",
        causas: [
            "Tiempo o presión insuficiente del soplado de asentamiento.",
            "Tiempo de contacto del macho insuficiente.",
            "Contrasoplo demasiado temprano o con presión excesiva.",
            "Cilindro de machos demasiado alto o demasiado bajo.",
            "Macho sucio, corto o trabajando sobrecalentado."
        ],
        acciones: [
            "Aumentar tiempo y presión del soplado de asentamiento.",
            "Retrasar el contrasoplo y regular su caudal neumático.",
            "Limpiar o cambiar machos sucios o desgastados.",
            "Calibrar la altura nominal del mecanismo del cilindro de machos."
        ]
    },
    {
        id: "saltado_boca",
        nombre: "Saltado Boca (Chipped Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Picadura, melladura o desprendimiento de vidrio en la superficie superior de sellado de la boca del envase. Impide el contacto uniforme del cierre provocando fugas o pérdida de gas.",
        causas: [
            "Cabeza sopladora descentrada o con amortiguación defectuosa (baja demasiado rápida y golpea).",
            "Pinzas de la sacadora (take-out) descalibradas, cerrando demasiado rápido o fuera de centro.",
            "Abertura del porta platinas con demasiada fuerza durante la reversión.",
            "Tubo del soplador desviado o vidrio acumulado en la cabeza sopladora."
        ],
        acciones: [
            "Centrar la cabeza sopladora y regular su amortiguación de descenso.",
            "Calibrar alineación y cierre suave de las pinzas de la sacadora.",
            "Ajustar la abertura simétrica del porta platinas.",
            "Inspeccionar y destapar cabezas sopladoras eliminando fragmentos de vidrio."
        ]
    },
    {
        id: "abertura_vidrio_boca",
        nombre: "Abertura Vidrio Boca (Line Over The Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Grieta o fisura que atraviesa la superficie de sellado de la boca del envase. Defecto crítico de seguridad y hermeticidad con riesgo inminente de fuga o contaminación.",
        causas: [
            "Soplado de asentamiento iniciado tardíamente después de la carga.",
            "Temporización del macho arriba desfasada (atrapa gases de combustión).",
            "Platinas y machos trabajando fríos.",
            "Equipo de entrega con acumulación de grafito o mojado por pulverizado de tijeras."
        ],
        acciones: [
            "Realizar el proceso de formación tan pronto como el vidrio cargue en el premolde.",
            "Aumentar la presión del soplado de asentamiento para mover el vidrio rápidamente.",
            "Instalar escudos protectores en canaletas para desviar agua de tijeras.",
            "Destapar escapes en el macho y anillo guía para purgar gases."
        ]
    },
    {
        id: "boca_desplazada",
        nombre: "Boca Desplazada (Offset Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Boca formada fuera de su alineación concéntrica correcta respecto al eje del envase (en sentido vertical u horizontal). Dificulta el asentamiento del cierre provocando fallas de apertura y tapado.",
        causas: [
            "Porta platinas lado molde desnivelado, inclinado o con resortes flojos.",
            "Bisagra del molde desalineada o con pasadores/bieletas gastadas.",
            "Amortiguación o velocidad incorrecta de la cabeza sopladora.",
            "Platina caliente que no libera suavemente el parison."
        ],
        acciones: [
            "Nivelar el porta platinas lado molde y cambiar resortes vencidos.",
            "Reemplazar pasadores y bieletas con holgura en la bisagra de molde.",
            "Ajustar amortiguación de transferencia e inversión.",
            "Aumentar ventilación de la platina para evitar sobrecalentamiento."
        ]
    },
    {
        id: "platina_caida",
        nombre: "Platina Caída (Cocked Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Desnivel angular pronunciado en la superficie de la boca respecto al plano horizontal del envase. Medido en planta con reloj comparador milimétrico.",
        causas: [
            "Calibración incorrecta del porta platinas y altura desajustada del macho.",
            "Tiempo de soplado de asentamiento o presión de macho insuficiente para fijar la boca sólidamente.",
            "Transferencia violenta y amortiguación deficiente de la sacadora."
        ],
        acciones: [
            "Calibrar la altura y nivelación del porta platinas sobre el molde (tolerancia estándar 1/16\").",
            "Aumentar el tiempo de asentamiento para consolidar la estructura del anillo de boca.",
            "Aplicar boquillas de enfriamiento de boca (finish cooling)."
        ]
    },
    {
        id: "arruga_boca",
        nombre: "Arruga Boca (Crizzled Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Múltiples líneas o grietas finas paralelas en la superficie de sellado de la boca. Al no reflejar la luz directamente son complejas de detectar visualmente pero comprometen el cierre hermético.",
        causas: [
            "Platinas calientes que no están liberando temperatura adecuadamente.",
            "Soplado final iniciado demasiado temprano.",
            "Cabeza sopladora bajando con impacto violento sobre el molde.",
            "En NNPB: presión de prensado excesiva o arrastre de macho lento."
        ],
        acciones: [
            "Aumentar ventilación en platinas y aplicar lubricación regular.",
            "Retardar el soplado final y suavizar el descenso de la cabeza sopladora.",
            "En NNPB: regular presión del cilindro de prensado a valores estándar."
        ]
    },
    {
        id: "boca_sucia",
        nombre: "Boca Sucia (Dirty Finish)",
        zona: "boca",
        gravedad: "Mayor",
        descripcion: "Superficie de la boca escamosa con manchas negras o depósitos de carbón procedentes de sobrelubricación de platinas y machos.",
        causas: [
            "Lubricación excesiva o hisopo demasiado cargado/sucio.",
            "Platina trabajando fría.",
            "Metalización excesiva de la moldería de boca."
        ],
        acciones: [
            "Reducir la frecuencia de hisopeado y usar hisopo de algodón limpio.",
            "Cumplir con el programa de cambio de moldería según ciclo de horas.",
            "Ajustar temperatura de la platina."
        ]
    },
    {
        id: "rebaba_anillo_boca",
        nombre: "Rebaba Anillo Boca (Flange Finish)",
        zona: "boca",
        gravedad: "Mayor",
        descripcion: "Aleta o rebaba de vidrio en la línea de partición de la platina o junta con el premolde.",
        causas: [
            "Porta platinas no ajusta correctamente sobre el lado del molde.",
            "Holgura excesiva entre platina y anillo guía.",
            "Bisagras de molde o premolde con pasadores gastados."
        ],
        acciones: [
            "Ajustar encastre de cola de milano de la platina.",
            "Cambiar piezas de boca gastadas.",
            "Verificar apriete y juego de bisagras."
        ]
    },
    {
        id: "angulo_bajo_falda",
        nombre: "Ángulo Bajo la Falda (Screw Cap Angle)",
        zona: "boca",
        gravedad: "Mayor",
        descripcion: "Ángulo geométrico incorrecto en la zona bajo la falda de la boca roscada. Impide que las trabas de seguridad de la cápsula se corten al girar la tapa.",
        causas: [
            "Desgaste dimensional en el anillo de boca del molde formador.",
            "Soplado de asentamiento deficiente que no copia el ángulo del molde."
        ],
        acciones: [
            "Medir con calibre de perfil de rosca y cambiar platinas desgastadas.",
            "Asegurar presión nominal en el soplado de asentamiento."
        ]
    },
    {
        id: "rayas_cuello_hombro",
        nombre: "Rayas Cuello - Hombro (Load Marks)",
        zona: "cuello",
        gravedad: "Mayor",
        descripcion: "Rayas o marcas superficiales en el cuello o transición al hombro originadas por fricción o choque térmico en la entrega de la gota.",
        causas: [
            "Premoldes calientes y secos (falta de lubricación adecuada).",
            "Desalineación o fricción en el equipo de entrega (scoop y canaletas).",
            "Carga de gota demasiado temprana."
        ],
        acciones: [
            "Alinear deflectores y canaletas para entrega suave y centrada.",
            "Lubricar premoldes con hisopo limpio y graduación correcta.",
            "Ajustar temporización de carga de la gota."
        ]
    },
    {
        id: "picado_cuello_hombro",
        nombre: "Picado Cuello - Hombro (Neck Ring Parting Line)",
        zona: "cuello",
        gravedad: "Mayor",
        descripcion: "Saltadura o astillamiento de vidrio en la línea de costura de la platina y el cuello por daño en los bordes del molde.",
        causas: [
            "Topes del premolde sueltos.",
            "Cilindro de machos posicionado demasiado arriba.",
            "Desprendimiento de metal en la arista de encastre del molde."
        ],
        acciones: [
            "Ajustar topes de premolde y calibrar altura del cilindro de machos.",
            "Reemplazar molde con aristas dañadas o desportilladas."
        ]
    }
,
    {
        id: "calcinado_hilos",
        nombre: "Calcinado en los Hilos / Rosca (Thread Check)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Fractura térmica o mecánica localizada en los filetes o hilos de la rosca de la boca. Defecto crítico (Manual Cristalerías de Chile S.A. §e / Bucher Emhart Glass): provoca rotura o desprendimiento de vidrio al aplicar el torque de tapado en línea de embotellado.",
        causas: [
            "Platinas trabajando excesivamente frías o sin precalentamiento uniforme.",
            "Apertura violenta o desnivelada del porta-platinas que engancha el hilo de rosca.",
            "Perfil de rosca de la platina con rebabas, daño mecánico o carbón acumulado.",
            "Gota de vidrio con punta fría al ingresar al premolde."
        ],
        acciones: [
            "Reducir el enfriamiento sobre las platinas o precalentar antes de cargar moldería.",
            "Regular la amortiguación de apertura del mecanismo porta-platinas.",
            "Limpiar o reemplazar platinas con filetes de rosca dañados.",
            "Rechazar inmediatamente las cavidades afectadas y verificar con polariscopio."
        ]
    },
    {
        id: "calcinado_platina",
        nombre: "Calcinado de Platina / Costura de Anillo (Ring Seam Check)",
        zona: "cuello",
        gravedad: "Crítico",
        descripcion: "Fisura horizontal o circunferencial ubicada en la unión entre la platina (molde de boca) y el premolde/molde. Debilita críticamente el cuello bajo la corona con riesgo de degollamiento bajo presión interna.",
        causas: [
            "Porta-platinas desnivelado o inclinado respecto al eje central del premolde o molde.",
            "Platina trabajando fría respecto a la temperatura del premolde.",
            "Golpe mecánico durante el cierre del premolde o en la inversión del parison.",
            "Holgura excesiva en pasadores y bieletas del mecanismo de inversión."
        ],
        acciones: [
            "Nivelar y alinear el porta-platinas a 1/16\" respecto a la línea central del molde.",
            "Ajustar la amortiguación del mecanismo de inversión (Invert Cushion).",
            "Atemperar las platinas y revisar el encastre de cola de milano.",
            "Reemplazar bujes y pasadores desgastados en brazos porta-platinas."
        ]
    },
    {
        id: "boca_estrellada",
        nombre: "Boca Estrellada (Starred / Split Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Red de fisuras múltiples estrelladas en el borde o labio superior de la boca del envase. Compromete totalmente la resistencia axial en la coronadora y la hermeticidad del cierre.",
        causas: [
            "Cabeza sopladora (Blowhead) bajando con impacto violento o sin amortiguación sobre la corona.",
            "Tubo de aire de la cabeza sopladora demasiado largo o descentrado golpeando el labio.",
            "Macho excesivamente frío o con presión de prensado desmedida.",
            "Pinzas de sacadora (Takeout) golpeando la superficie superior de la boca."
        ],
        acciones: [
            "Regular la amortiguación neumática de descenso de la cabeza sopladora.",
            "Verificar altura y concentricidad de las boquillas y tubos de soplado final.",
            "Calibrar la altura de las pinzas de sacadora (Takeout) respecto a la platina.",
            "Controlar el caudal de enfriamiento interno del macho."
        ]
    },
    {
        id: "aleta_doblez_boca",
        nombre: "Marca de Doblez o Aleta en la Boca (Fold / Fin on Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Pliegue agudo o aleta cortante de vidrio doblada sobre la superficie superior de sellado de la boca. Impide el cierre hermético y genera desprendimiento de fragmentos al tapar.",
        causas: [
            "Carga de gota descentrada o atrasada que se pliega al entrar al anillo de boca.",
            "Soplado de asentamiento (Settle Blow) tardío o con presión insuficiente.",
            "Holgura excesiva entre el macho y el anillo guía (Thimble).",
            "Exceso de pasta lubricante en la platina."
        ],
        acciones: [
            "Adelantar el soplado de asentamiento tan pronto la gota ingresa al premolde.",
            "Alinear el equipo de entrega (scoop, canaleta y deflector) con el premolde.",
            "Reemplazar anillos guía y machos con desgaste dimensional.",
            "Utilizar lubricación moderada con hisopo limpio y activar rechazo automático (SWAB)."
        ]
    },
    {
        id: "vidrio_pegado_macho",
        nombre: "Vidrio Pegado en el Macho (Glass Stuck on Plunger)",
        zona: "cuello",
        gravedad: "Crítico",
        descripcion: "Adherencia y arrastre de vidrio incandescente en la punta del macho durante el ciclo de prensado o contrasoplo, desgarrando el interior del cuello y generando filamentos, púas o columpios internos.",
        causas: [
            "Macho sobrecalentado por obstrucción o baja presión en el tubo de enfriamiento interno.",
            "Recubrimiento de Colmonoy en la punta del macho desgastado, poroso o fisurado.",
            "Tiempo de contacto del macho excesivamente largo.",
            "Falta de lubricación o carbonización de lubricante en la punta del punzón."
        ],
        acciones: [
            "Sustituir inmediatamente el macho afectado y verificar su recubrimiento de Colmonoy.",
            "Purgar y comprobar la presión de aire de enfriamiento interno del macho.",
            "Ajustar el tiempo de contacto del macho arriba OFF respecto a la tapa OFF.",
            "Rechazar en caliente el lote de la cavidad e inspeccionar ausencia de columpios."
        ]
    },
    {
        id: "mala_distribucion_cuello",
        nombre: "Mala Distribución de Vidrio en Cuello / Estrangulamiento (Choked / Slug Neck)",
        zona: "cuello",
        gravedad: "Crítico",
        descripcion: "Acumulación asimétrica interna de vidrio o estrangulamiento severo en el interior del cuello. Impide la introducción de los tubos de llenado de alta velocidad y provoca rotura de boquillas en la embotelladora.",
        causas: [
            "Recalentamiento insuficiente o asimétrico del parison antes de la inversión.",
            "Gota de vidrio demasiado fría o con gradiente térmico marcado.",
            "Contrasoplo (Counter Blow) débil, corto o con orificios de macho parcialmente obstruidos.",
            "Macho corto o con carrera insuficiente."
        ],
        acciones: [
            "Verificar calibre pasa/no-pasa (brochado interno) al 100% en línea.",
            "Destapar perforaciones del macho y ajustar presión/duración del contrasoplo.",
            "Aumentar el tiempo de recalentamiento (Reheat) antes del soplado final.",
            "Homogeneizar la temperatura de la gota en el canal acondicionador."
        ]
    },
    {
        id: "bullon_boca",
        nombre: "Bullón en la Boca (Blister on Finish)",
        zona: "boca",
        gravedad: "Crítico",
        descripcion: "Burbuja de aire o gas de pared sumamente delgada alojada en el borde o superficie de sellado de la boca. Se rompe con facilidad durante el transporte o bajo la presión del cabezal de tapado, liberando astillas de vidrio.",
        causas: [
            "Exceso de lubricación (swabbing) en platinas o machos sin descarte posterior.",
            "Aire atrapado durante el corte de tijeras por cuchillas descentradas o exceso de agua.",
            "Soplado de asentamiento tardío que atrapa gases de combustión en el anillo.",
            "Nivel de vidrio bajo o fluctuante en el tazón del alimentador (Spout)."
        ],
        acciones: [
            "Descartar obligatoriamente de 2 a 3 ciclos tras lubricar platinas y machos.",
            "Revisar el traslape y enfriamiento de las cuchillas de tijera en el alimentador.",
            "Adelantar el soplado de asentamiento para evacuar gases de la platina.",
            "Controlar la estabilidad de temperatura y nivel en el tazón del alimentador."
        ]
    }
];
