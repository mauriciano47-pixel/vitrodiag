// --- CATÁLOGO DE DEFECTOS: ZONA CUERPO (MÁQUINAS I.S.) ---
export const DEFECTOS_CUERPO = [
            // --- CUERPO ---
            {
                id: "calcinado_hombro",
                nombre: "Calcinado en Hombro (Carbon Shoulder Mark)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Residuos o manchas negras de lubricante calcinado incrustadas en la zona del hombro de la botella donde el parison expande inicialmente.",
                causas: [
                    "Exceso de pasta de swabbing acumulada en la parte superior del molde terminador.",
                    "La gota o parison roza la zona de cierre superior antes del soplado final.",
                    "Hombro del molde operando a temperatura excesiva sin enfriamiento suficiente."
                ],
                acciones: [
                    "Soplar aire de limpieza en el hombro del molde y retirar excesos con hisopo seco.",
                    "Ajustar la apertura y cierre suave del molde terminador.",
                    "Verificar y balancear el enfriamiento de hombro en la sección."
                ]
            },
            {
                id: "calcinado_cuerpo",
                nombre: "Calcinado en Cuerpo / Mancha Swab (Carbon Streak / Swab Burn)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Vetas o manchas negras de grafito calcinado extendidas a lo largo de la superficie del cuerpo del envase. Afecta la transparencia, estética y genera puntos débiles de adhesión.",
                causas: [
                    "Exceso de lubricación directa en las cavidades del molde terminador.",
                    "La gota de vidrio cae sobre zonas con charcos de aceite no evaporado en el pre-molde.",
                    "Desprendimiento de carbonilla o costras resecas de las caras del molde."
                ],
                acciones: [
                    "Secar y pulir las caras del molde terminador con hisopo seco para retirar el exceso.",
                    "Regular la frecuencia de swabbing respetando el intervalo del turno (ej. cada 20 min).",
                    "Asegurar que la gota de vidrio cargue perfectamente centrada sin rozar paredes impregnadas."
                ]
            },
            {
                id: "grasa_quemada_molde",
                nombre: "Grasa Quemada de Partición (Mold Seam Burn / Carbon Residue)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Líneas o costras oscuras de lubricante calcinado acumuladas a lo largo de la línea de costura/partición del molde o en grabados.",
                causas: [
                    "Acumulación de residuos de swabbing en los encajes de cierre del molde.",
                    "Holgura o desgaste en las bisagras de cierre que permite que la grasa ingrese a la cavidad.",
                    "Temperatura excesiva de moldería que calcina rápidamente el compuesto orgánico."
                ],
                acciones: [
                    "Limpiar los encajes y líneas de partición del molde terminador.",
                    "Comprobar el apriete y cierre de los mecanismos de molde.",
                    "Optimizar el flujo de aire de enfriamiento del molde para evitar sobrecalentamiento."
                ]
            },
            {
                id: "columpio",
                nombre: "Columpio / Pelo en el Cuerpo (Birdswing / Birdcage)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Un filamento o hilo de vidrio que cruza de pared a pared por el interior de la botella. Es un defecto muy peligroso de descarte inmediato.",
                causas: [
                    "Vidrio excesivamente caliente y fluido.",
                    "Presión de prensado baja (bajo los 15 psi) que deforma mal el parison.",
                    "Hisopeado (lubricación) muy cargado que colapsa el parison internamente."
                ],
                acciones: [
                    "Aumentar el enfriamiento de los premoldes.",
                    "Asegurar una presión de prensado constante y correcta.",
                    "Moderar la cantidad de aceite y frecuencia de la lubricación manual."
                ]
            },
            {
                id: "pared_delgada",
                nombre: "Pared Delgada / Mala Distribución (Thin Wall)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Zonas de la botella con espesor de vidrio extremadamente bajo, haciéndolas susceptibles a estallar por la presión del llenado.",
                causas: [
                    "Estiramiento disparejo del parison por falta de enfriamiento uniforme.",
                    "Gota desviada al caer en el premolde."
                ],
                acciones: [
                    "Corregir el flujo de enfriamiento de aire en los moldes.",
                    "Alinear los deflectores para centrar la caída de la gota en el premolde."
                ]
            },
            {
                id: "costura_saliente",
                nombre: "Costura de Molde Saliente (Mismatched Mold)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Desfase o desalineación visible y palpable en la costura de las dos hojas del molde final en el cuerpo de la botella.",
                causas: [
                    "Mecanismos porta-moldes gastados con juego mecánico.",
                    "Cierre de moldes asimétrico."
                ],
                acciones: [
                    "Reemplazar los pernos de alineación y bujes porta-moldes.",
                    "Verificar y corregir el paralelismo en el cierre."
                ]
            },
            {
                id: "ondas_frias",
                nombre: "Ondas Frías / Pliegues (Cold Marks)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Superficie corrugada u ondas marcadas en el exterior de la botella. Indica enfriamiento disparejo del vidrio antes del soplado.",
                causas: [
                    "Vidrio enfriado prematuramente al tocar las paredes metálicas frías.",
                    "Velocidad de carga de la gota muy lenta."
                ],
                acciones: [
                    "Aumentar la temperatura de los premoldes disminuyendo el aire de enfriamiento.",
                    "Limpiar y ajustar el canal de caída de gota."
                ]
            },
            {
                id: "burbujas",
                nombre: "Burbujas / Blisters (Blisters & Seeds)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Cavidades gaseosas atrapadas dentro de la pared de vidrio. Si son grandes (blisters) o están cerca de la superficie, debilitan el envase.",
                causas: [
                    "Aire atrapado en la caída de la gota debido a mala forma.",
                    "Problemas de refinación en el horno de fundición (semillas finas)."
                ],
                acciones: [
                    "Ajustar el peso, longitud y forma de la gota en la cizalla.",
                    "Informar a control de calidad y operador de horno para revisar la combustión."
                ]
            },
            {
                id: "piedras",
                nombre: "Piedras en el Vidrio (Stones / Inclusions)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Partículas sólidas de material refractario o vidrio no fundido incrustadas en el envase, propensas a que la botella estalle.",
                causas: [
                    "Desprendimiento de material de las paredes del horno de vidrio fundido.",
                    "Presencia de contaminantes no metálicos en la materia prima."
                ],
                acciones: [
                    "Detener el envase, reportar y enviar muestra para análisis petrográfico.",
                    "Controlar el porcentaje y calidad de calcín (vidrio reciclado) usado."
                ]
            },
            {
                id: "marcas_punzon",
                nombre: "Marcas de Punzón (Plunger Marks)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Manchas opacas o marcas verticales internas en la zona donde el macho / plunger hace contacto directo.",
                causas: [
                    "Punzón muy caliente o con lubricación quemada.",
                    "Vidrio muy caliente."
                ],
                acciones: [
                    "Lubricar el punzón de manera limpia.",
                    "Bajar la temperatura del punzón aumentando su aire interno de enfriamiento."
                ]
            },
            {
                id: "arrastre_cepillo",
                nombre: "Marcas de Arrastre (Brush / Drag Marks)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Líneas finas verticales sobre la superficie del hombro o cuerpo de la botella.",
                causas: [
                    "El parison roza contra las paredes internas del molde final durante el traspaso."
                ],
                acciones: [
                    "Ajustar la sincronización del Invert/Traspaso para un movimiento limpio y centrado.",
                    "Controlar la holgura en el mecanismo."
                ]
            },
            {
                id: "vidrio_sucio",
                nombre: "Vidrio Sucio (Dirty Ware)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Acumulación de depósitos oscuros o carbonosos incrustados en la superficie externa del vidrio.",
                causas: [
                    "Exceso de aceite e hisopado excesivo que quema el lubricante en el molde.",
                    "Moldería sucia con residuos de grasa."
                ],
                acciones: [
                    "Moderar la cantidad de desmoldante aplicada.",
                    "Limpiar los moldes con un cepillo adecuado o cambiarlos."
                ]
            },
            {
                id: "grieta_hombro",
                nombre: "Grieta en Hombro (Shoulder Check)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Fisura en el hombro de la botella. Puede ser transparente y romperse fácilmente.",
                causas: [
                    "El brazo del molde o las guías finales tocan con fuerza el hombro al abrir."
                ],
                acciones: [
                    "Ajustar amortiguación y velocidad de apertura en el lado moldes."
                ]
            },
            {
                id: "hombro_hundido",
                nombre: "Hombro Hundido (Sunken Shoulder)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "El hombro de la botella se colapsa hacia adentro perdiendo su perfil de diseño.",
                causas: [
                    "Vidrio excesivamente caliente al desmoldar en la zona superior del cuerpo.",
                    "El soplado final no se mantuvo el tiempo necesario para solidificar la silueta."
                ],
                acciones: [
                    "Incrementar enfriamiento en la sección del molde correspondiente al hombro.",
                    "Prolongar el tiempo de soplado final retardando el Blow Off."
                ]
            },
            {
                id: "costura_vertical_saliente",
                nombre: "Costura Vertical Saliente (High Joint)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Un escalón o rebaba lineal vertical muy pronunciada a lo largo del cuerpo de la botella.",
                causas: [
                    "Desgaste físico en las guías de encastre de las hojas del molde final.",
                    "Presión de cierre insuficiente."
                ],
                acciones: [
                    "Mandar a rectificar o cambiar los moldes finales.",
                    "Ajustar los cilindros del mecanismo de cierre."
                ]
            },
            {
                id: "pared_delgada_hombro",
                nombre: "Hombro Delgado (Thin Shoulder)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Espesor de vidrio críticamente bajo en el hombro de la botella en comparación con el cuerpo.",
                causas: [
                    "El parison se estira excesivamente arriba por temperatura alta local.",
                    "Gota cayendo descentrada."
                ],
                acciones: [
                    "Ajustar la distribución de calor en el parison regulando el enfriamiento axial del premolde.",
                    "Centrar deflectores de gota."
                ]
            },
            {
                id: "vidrio_escamoso",
                nombre: "Vidrio Escamoso (Scaly Glass)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Textura exterior áspera o con pequeñas escamas superficiales que opacan el envase.",
                causas: [
                    "Moldería excesivamente fría o húmeda.",
                    "Exceso de lubricante emulsionado con agua en el hisopo."
                ],
                acciones: [
                    "Reducir enfriamiento local para subir temperatura de moldes.",
                    "Utilizar hisopos limpios y secos para aplicar el desmoldante."
                ]
            },
            {
                id: "mancha_oxido",
                nombre: "Mancha de Óxido (Rust Marks)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Manchas rojizas o marrones oscuras incrustadas en el vidrio.",
                causas: [
                    "Partículas de hierro oxidado provenientes de las pinzas o guías metálicas calientes.",
                    "Desgaste abrasivo de componentes de la sección."
                ],
                acciones: [
                    "Limpiar y revestir las pinzas del takeout con material grafito/carbono.",
                    "Reemplazar guías desgastadas."
                ]
            },
            {
                id: "marca_planchado",
                nombre: "Marca de Planchado (Iron Mark)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Zona opaca, rugosa o quemada en el exterior del vidrio debido al contacto metálico abrasivo.",
                causas: [
                    "El molde final está muy seco o sobrecalentado localmente.",
                    "El parison roza mecánicamente contra las bisagras."
                ],
                acciones: [
                    "Aplicar un hisopeado ligero con desmoldante grafito.",
                    "Alinear el mecanismo de inversión para evitar el roce."
                ]
            },
            {
                id: "estrias_cuerpo",
                nombre: "Estría de Cuerpo (Laps)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Pliegues o líneas onduladas en espiral que se aprecian en las paredes de la botella.",
                causas: [
                    "Gota de vidrio muy fría al ingresar en el premolde.",
                    "La gota cae girando o rozando los deflectores."
                ],
                acciones: [
                    "Aumentar la temperatura de la gota.",
                    "Limpiar y alinear el canal de entrega de gota."
                ]
            },
            {
                id: "hombro_sucio",
                nombre: "Hombro Sucio (Dirty Shoulder / Carbon Marks)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Manchas negras o costras opacas de carbón localizadas específicamente en la zona del hombro.",
                causas: [
                    "Lubricación manual excesiva del premolde que se quema y es arrastrada.",
                    "Macho sucio con acumulación de grafito."
                ],
                acciones: [
                    "Optimizar el ciclo de swabbing en moldes y premoldes.",
                    "Limpiar el macho con cepillo de alambre blando."
                ]
            },
            {
                id: "hombro_desalineado",
                nombre: "Hombro Desalineado (Mismatched Shoulder)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Un escalón o reborde horizontal en la zona donde une el cuello con el hombro.",
                causas: [
                    "El molde final está montado desalineado respecto al soporte del cuello.",
                    "Holguras mecánicas porta-moldes."
                ],
                acciones: [
                    "Ajustar el centrado de los moldes finales.",
                    "Eliminar juego mecánico en las bisagras porta-moldes."
                ]
            },
            {
                id: "gota_desviada",
                nombre: "Gota de Vidrio Desviada (Missed Gob Mark)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Marcas o estrías longitudinales causadas porque la gota rozó el embudo o las guías de caída.",
                causas: [
                    "Deflectores sucios, desalineados o secos.",
                    "Presión del aire de soplado de canal incorrecta."
                ],
                acciones: [
                    "Alinear el sistema de distribución de gota.",
                    "Limpiar e hisopar el canal con grafito en suspensión."
                ]
            },
            {
                id: "vidrio_hundido",
                nombre: "Vidrio Hundido / Chupado (Sunken Sidewall)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Depresión cóncava en las paredes de la botella que deforma el contorno circular del envase.",
                causas: [
                    "Enfriamiento deficiente de los moldes finales.",
                    "La botella sale muy caliente y colapsa por vacío interno al enfriar."
                ],
                acciones: [
                    "Aumentar el caudal de aire de enfriamiento al molde final.",
                    "Ampliar el tiempo de soplado final."
                ]
            },
            {
                id: "pliegue_carga",
                nombre: "Pliegue de Carga (Loading Lap / Gob Mark)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "Doblezo pliegue de vidrio visible en el cuerpo que debilita la resistencia mecánica del envase.",
                causas: [
                    "La gota cae de lado o mal orientada en el premolde.",
                    "Premoldes excesivamente fríos."
                ],
                acciones: [
                    "Corregir la alineación del embudo de carga.",
                    "Reducir enfriamiento local de los premoldes."
                ]
            },
            {
                id: "burbujas_superficie",
                nombre: "Burbujas en Superficie (Surface Blisters)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Burbujas con pared de vidrio muy delgada en el exterior o interior del envase que se rompen con facilidad.",
                causas: [
                    "Aire atrapado durante la carga por caída tosca de la gota.",
                    "Horno de vidrio con mala refinación."
                ],
                acciones: [
                    "Suavizar y centrar la carga de la gota.",
                    "Revisar parámetros de combustión y tiro de chimeneas del horno."
                ]
            },
            {
                id: "costra_molde",
                nombre: "Costra de Molde (Mold Paste Scale)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Incrustaciones rugosas y grises de óxido metálico o carbón en la superficie de la botella.",
                causas: [
                    "Moldería vieja u oxidada.",
                    "Uso de desmoldante inadecuado que deja residuos sólidos."
                ],
                acciones: [
                    "Mandar los moldes a limpieza por chorreado (blasting).",
                    "Utilizar desmoldante grafito de calidad homologada."
                ]
            },
            {
                id: "hilos_internos",
                nombre: "Hilos Internos de Vidrio (Tears / Thread in Bottle)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Finísimos filamentos de vidrio sueltos o adheridos al interior del envase.",
                causas: [
                    "La gota de vidrio se desgarra o estira al cortarse en la cizalla.",
                    "Vidrio frío en el alimentador."
                ],
                acciones: [
                    "Alinear cizallas y asegurar lubricación con agua constante.",
                    "Aumentar temperatura del vidrio en el alimentador."
                ]
            },
            {
                id: "cuerpo_ovalado",
                nombre: "Cuerpo Deformado Ovalado (Out of Round)",
                zona: "cuerpo",
                gravedad: "Mayor",
                descripcion: "La botella pierde su geometría circular y adquiere sección elíptica u ovalada.",
                causas: [
                    "Extracción a alta temperatura y manipulación tosca del transportador.",
                    "Las hojas del molde final no cierran simétricamente."
                ],
                acciones: [
                    "Ajustar velocidad del takeout y enfriar más el cuerpo.",
                    "Corregir el cierre del molde."
                ]
            },
            {
                id: "grieta_impacto",
                nombre: "Grieta de Impacto (Impact Check)",
                zona: "cuerpo",
                gravedad: "Crítico",
                descripcion: "Fisura en forma de estrella o media luna en la pared de la botella provocada por golpes mecánicos.",
                causas: [
                    "Choques violentos entre botellas en el transportador caliente.",
                    "Golpes contra las barandas del transportador."
                ],
                acciones: [
                    "Sincronizar la velocidad de la correa de salida.",
                    "Revestir barandas de guía con carburo o materiales no abrasivos calientes."
                ]
            },
            {
                id: "crazing_body",
                nombre: "Vidrio Escamado en Cuerpo (Crazing / Scaly Body)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Textura exterior quebradiza y microfisurada en una zona amplia del cuerpo del envase.",
                causas: [
                    "Molde final extremadamente frío en relación al vidrio fundido.",
                    "Exceso de agua en el aire de enfriamiento."
                ],
                acciones: [
                    "Disminuir aire de enfriamiento exterior.",
                    "Instalar trampas de humedad en la línea de aire de la sección."
                ]
            },
            {
                id: "marca_soplo",
                nombre: "Marca de Plato de Soplo (Blowhead Mark)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Aro circular o relieve marcado en la zona de transición cuello-hombro.",
                causas: [
                    "El cabezal de soplado (Blowhead) baja descentrado o ejerce excesiva presión mecánica."
                ],
                acciones: [
                    "Alinear el brazo del cabezal de soplado y ajustar su carrera/presión."
                ]
            },
            {
                id: "marca_empujador",
                nombre: "Marca de Empujador (Pusher Mark)",
                zona: "cuerpo",
                gravedad: "Menor",
                descripcion: "Rasguño o marca estética opaca en el lateral del cuerpo de la botella caliente.",
                causas: [
                    "Las almohadillas del empujador (Pusher) están desgastadas, sucias o descentradas.",
                    "Sincronía tosca de empuje."
                ],
                acciones: [
                    "Reemplazar o limpiar los insertos del empujador.",
                    "Suavizar el perfil de movimiento neumático."
                ]
            }
];
