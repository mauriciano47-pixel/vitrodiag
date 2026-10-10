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
            }
];
