// --- CATÁLOGO DE DEFECTOS: ZONAS FONDO Y GENERALES (MÁQUINAS I.S.) ---
export const DEFECTOS_FONDO_GENERAL = [
            // --- FONDO ---
            {
                id: "calcinado_fondo",
                nombre: "Calcinado en Fondo / Placa de Fondo (Bottom Plate Carbon / Black Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Depósito de carbón o grafito negro incrustado en el asiento de fondo (placa de fondo / bottom plate), picado o estriado de apoyo de la botella.",
                causas: [
                    "Exceso de lubricante de swabbing que escurre por gravedad hacia la placa de fondo del molde terminador.",
                    "Ranuras de vacío o venteo de la placa de fondo obstruidas con carbón acumulado.",
                    "Placa de fondo trabajando a temperatura muy elevada que carboniza el aceite al instante."
                ],
                acciones: [
                    "Limpiar la placa de fondo y destapar los orificios de venteo de fondo con aire a presión.",
                    "Evitar hisopear en exceso la parte inferior del molde terminador.",
                    "Verificar y aumentar la presión de enfriamiento en la placa de fondo de la sección."
                ]
            },
            {
                id: "fondo_delgado",
                nombre: "Fondo Delgado (Thin Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Espesor de vidrio críticamente bajo en la base de la botella, lo cual compromete su estabilidad.",
                causas: [
                    "El parison está muy estirado verticalmente por exceso de calor en el fondo.",
                    "Retardo excesivo en el inicio del soplado final."
                ],
                acciones: [
                    "Reducir temperatura del fondo del parison regulando el soplado interno.",
                    "Adelantar el inicio del soplado final para fijar la base antes."
                ]
            },
            {
                id: "grieta_base",
                nombre: "Grieta en la Base (Bottom Check)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Fisuras que se extienden en la base o asiento del envase. Riesgo alto de rotura al apoyar la botella.",
                causas: [
                    "El fondo del molde final está excesivamente frío.",
                    "Golpe o caída brusca al depositar la botella en la placa muerta (Dead Plate)."
                ],
                acciones: [
                    "Disminuir enfriamiento en la placa de fondo del molde.",
                    "Ajustar la suavidad de las pinzas del takeout al soltar el envase."
                ]
            },
            {
                id: "asiento_desparejo",
                nombre: "Asiento Desparejo / Tambaleo (Rocking Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "La botella no se apoya firmemente en una superficie plana y se tambalea.",
                causas: [
                    "La base de la botella está demasiado blanda/caliente al desmoldar y se deforma por la gravedad o por el flujo de aire.",
                    "El aire de la placa muerta (Dead Plate) está mal direccionado."
                ],
                acciones: [
                    "Aumentar el tiempo de soplado final o el enfriamiento del fondo del molde.",
                    "Ajustar la presión de los sopladores en el Dead Plate para un enfriamiento parejo."
                ]
            },
            {
                id: "rebaba_fondo",
                nombre: "Rebaba de Fondo / Marca de Fondo (High Baffle Mark)",
                zona: "fondo",
                gravedad: "Menor",
                descripcion: "Relieve de vidrio filoso o excesivo alrededor de la costura circular del fondo del molde.",
                causas: [
                    "El fondo del molde no cierra al ras con las hojas de molde.",
                    "Desgaste físico en la moldería de fondo."
                ],
                acciones: [
                    "Verificar y ajustar la altura y encastre del fondo del molde.",
                    "Reemplazar el fondo desgastado."
                ]
            },
            {
                id: "fondo_hundido",
                nombre: "Fondo Hundido (Sunken Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "La base de la botella se hunde hacia adentro por succión o deformación plástica.",
                causas: [
                    "Base del parison excesivamente caliente y falta de presión en el soplado final."
                ],
                acciones: [
                    "Ajustar la presión de aire de soplado final.",
                    "Mejorar enfriamiento local de la base."
                ]
            },
            {
                id: "pico_base",
                nombre: "Pico de Base (Base Spike)",
                zona: "fondo",
                gravedad: "Crítico",
                descripcion: "Un pequeño filamento o aguja de vidrio filoso que sobresale internamente desde el fondo hacia arriba.",
                causas: [
                    "Punzón o aguja del macho desgastados o con rebabas metálicas.",
                    "Vidrio frío en el extremo inferior de la gota que se desgarra al presionar."
                ],
                acciones: [
                    "Inspeccionar, pulir o reemplazar la punta del punzón de prensado.",
                    "Asegurar un corte cizalla limpio y temperatura uniforme."
                ]
            },
            {
                id: "fondo_inclinado",
                nombre: "Fondo Inclinado (Crooked Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "La superficie de apoyo inferior de la botella no es paralela a la horizontal, inclinando la botella entera.",
                causas: [
                    "El fondo del molde está desalineado o suelto en su soporte.",
                    "Enfriamiento muy descompensado (un lado de la base está mucho más caliente)."
                ],
                acciones: [
                    "Alinear y fijar firmemente el fondo del molde.",
                    "Ajustar el aire de enfriamiento del fondo."
                ]
            },
            {
                id: "costura_fondo_saliente",
                nombre: "Costura de Fondo Saliente (High Bottom Joint)",
                zona: "fondo",
                gravedad: "Menor",
                descripcion: "Un reborde pronunciado de vidrio en la línea circular donde une la placa del fondo con las dos hojas del molde.",
                causas: [
                    "El fondo está montado muy abajo o las hojas del molde no cierran correctamente sobre él.",
                    "Diferencia dimensional en la moldería."
                ],
                acciones: [
                    "Subir o ajustar la placa de fondo en su base porta-fondos.",
                    "Limpiar canales y juntas."
                ]
            },
            {
                id: "fondo_deformado",
                nombre: "Fondo Deformado (Deformed Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Deformación plástica severa de la base de la botella ocurrida durante el desmoldeo.",
                causas: [
                    "Las pinzas de extracción tiran del envase antes de que la base solidifique.",
                    "El soplado final terminó antes de tiempo."
                ],
                acciones: [
                    "Retardar ligeramente el movimiento del takeout.",
                    "Incrementar la duración del soplado final."
                ]
            },
            {
                id: "fondo_abombado",
                nombre: "Fondo Abombado / Saliente (Bulged Bottom)",
                zona: "fondo",
                gravedad: "Crítico",
                descripcion: "El fondo del envase sobresale hacia afuera impidiendo que la botella se pare de forma estable.",
                causas: [
                    "Soplado final muy corto o presión de soplado insuficiente.",
                    "La base de la botella está demasiado caliente al desmoldar."
                ],
                acciones: [
                    "Aumentar el tiempo del soplado final.",
                    "Enfriar más la placa de fondo regulando los caudales de aire."
                ]
            },
            {
                id: "fondo_excentrico",
                nombre: "Fondo Excéntrico (Offset Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "La placa del fondo queda desplazada horizontalmente con respecto al eje de la botella.",
                causas: [
                    "Los brazos del molde no cierran centrados sobre el fondo.",
                    "Ajuste e instalación deficiente de la placa del fondo."
                ],
                acciones: [
                    "Verificar y centrar el soporte de la placa de fondo.",
                    "Eliminar juegos mecánicos."
                ]
            },
            {
                id: "desgaste_talon",
                nombre: "Desgaste en Talón del Fondo (Chipped Heel)",
                zona: "fondo",
                gravedad: "Crítico",
                descripcion: "Falta un fragmento de vidrio en la arista de la base de la botella, debilitando el apoyo.",
                causas: [
                    "Golpes en los transportadores debido a mala transferencia.",
                    "Apertura brusca del molde final."
                ],
                acciones: [
                    "Ajustar amortiguación de apertura de moldes.",
                    "Corregir la alineación del takeout y velocidad de la correa."
                ]
            },
            {
                id: "high_baffle_seam",
                nombre: "Costura Saliente Circular (High Baffle Seam)",
                zona: "fondo",
                gravedad: "Menor",
                descripcion: "Un filo sobresaliente circular en la base de la botella en la costura fondo-molde.",
                causas: [
                    "Placa de fondo con desgaste físico en los bordes de asiento.",
                    "Cierre incompleto de moldes."
                ],
                acciones: [
                    "Reemplazar la placa de fondo gastada.",
                    "Aumentar presión de cierre de moldes."
                ]
            },
            {
                id: "fondo_delgado_localizado",
                nombre: "Fondo Delgado Localizado (Spotty Thin Bottom)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Punto específico en la base de la botella con espesor de vidrio extremadamente bajo.",
                causas: [
                    "Gota cayendo ladeada y descentrada en el premolde.",
                    "Temperatura del fondo del premolde desigual."
                ],
                acciones: [
                    "Centrar deflectores de carga.",
                    "Revisar el circuito de enfriamiento de la placa de fondo."
                ]
            },
            {
                id: "fisura_interna_fondo",
                nombre: "Fisura Interna de Fondo (Inside Bottom Check)",
                zona: "fondo",
                gravedad: "Crítico",
                descripcion: "Fisura en la superficie interna del fondo de la botella que puede causar fallas catastróficas por presión interna.",
                causas: [
                    "El punzón del macho golpea el fondo con exceso de fuerza o desalineado.",
                    "Choque térmico en el desmolde."
                ],
                acciones: [
                    "Alinear el plunger de prensado.",
                    "Moderar enfriamiento de la base del molde."
                ]
            },
            {
                id: "fisura_talon",
                nombre: "Fisura en Talón del Fondo (Heel Check)",
                zona: "fondo",
                gravedad: "Mayor",
                descripcion: "Fisura transparente y delgada que recorre la arista curva de la base del envase.",
                causas: [
                    "Contacto de la botella caliente con metales fríos en el transportador.",
                    "Fondo del molde frío."
                ],
                acciones: [
                    "Precalentar las guías y empujadores.",
                    "Reducir enfriamiento del fondo del molde."
                ]
            },

            // --- GENERALES ---
            {
                id: "pintas_negras_grafito",
                nombre: "Pintas Negras / Inclusiones de Grafito Calcinado (Carbon / Graphite Inclusions)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Partículas o motas puntuales de color negro (carbón o grafito calcinado) incrustadas en el espesor del vidrio en cualquier zona de la botella.",
                causas: [
                    "Desprendimiento de escamas de grafito desde las canaletas de distribución (delivery) o cuchillas de tijera.",
                    "Residuos de carbón arrastrados por el flujo de vidrio fundido en el alimentador.",
                    "Contaminación por suciedad ambiental o herramientas de manipulación sucias."
                ],
                acciones: [
                    "Limpiar e inspeccionar las canaletas y cucharas del mecanismo de distribución de gotas.",
                    "Verificar la lubricación y rociado de agua/aceite en las cuchillas de tijera del alimentador.",
                    "Soplar aire de limpieza en los deflectores de canaleta."
                ]
            },
            {
                id: "botella_deformada",
                nombre: "Botella Deformada / Leaner (Out of Shape)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La botella pierde su geometría cilíndrica o se inclina, excediendo la tolerancia de verticalidad.",
                causas: [
                    "El envase sale demasiado blando y caliente del molde final.",
                    "Velocidad del transportador muy alta que deforma la botella caliente por inercia.",
                    "Enfriamiento deficiente de los moldes."
                ],
                acciones: [
                    "Reducir velocidad del alimentador o aumentar el enfriamiento general.",
                    "Incrementar el flujo de aire de enfriamiento del molde.",
                    "Ajustar guías y velocidad del transportador."
                ]
            },
            {
                id: "vidrio_frio",
                nombre: "Piel de Naranja / Vidrio Frío (Orange Peel)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Textura rugosa en la superficie de la botella parecida a la piel de una naranja. Afecta la estética y transparencia.",
                causas: [
                    "Temperatura del vidrio fundido en el alimentador está muy baja.",
                    "Moldería excesivamente fría."
                ],
                acciones: [
                    "Subir la temperatura de la gota ajustando los quemadores del canal.",
                    "Reducir el enfriamiento de los moldes de la sección."
                ]
            },
            {
                id: "vidrio_caliente",
                nombre: "Deformación por Vidrio Caliente (Hot Glass Deformation)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "El envase se deforma en el cuello, cuerpo u hombro por falta de rigidez estructural tras salir de la moldería.",
                causas: [
                    "Temperatura global del vidrio muy elevada.",
                    "Ciclo de la máquina IS demasiado rápido, impidiendo el enfriamiento óptimo."
                ],
                acciones: [
                    "Disminuir la temperatura del alimentador de vidrio.",
                    "Ajustar la temporización reduciendo velocidad (ciclos/minuto) si es crítico."
                ]
            },
            {
                id: "corte_cizalla",
                nombre: "Marca de Cizalla (Shear Mark)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Una cicatriz oscura con forma de 'C' en el fondo o boca de la botella, que puede iniciar una fisura.",
                causas: [
                    "Cuchillas de la cizalla desafiladas, mal lubricadas o desalineadas.",
                    "El agua de enfriamiento de la cizalla cae de forma dispareja."
                ],
                acciones: [
                    "Cambiar o afilar las cuchillas de cizalla.",
                    "Alinear el chorro de agua lubricante para un enfriamiento uniforme sobre las cuchillas."
                ]
            },
            {
                id: "envases_pegados",
                nombre: "Envases Pegados (Stuck Glass)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Botellas que se tocan y se fusionan o marcan entre sí en el transportador caliente.",
                causas: [
                    "Alineamiento incorrecto del empujador (Pusher).",
                    "Falta de espacio o sincronía de salida en la correa."
                ],
                acciones: [
                    "Ajustar y sincronizar los tiempos del empujador neumático/eléctrico.",
                    "Regular la velocidad del transportador de botellas calientes."
                ]
            },
            {
                id: "corte_cizalla_desviado",
                nombre: "Corte Cizalla Excéntrico (Off-Center Shear Mark)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La marca o línea de corte de cizalla aparece desplazada hacia un lado de la base del envase.",
                causas: [
                    "Las cuchillas de la cizalla no están centradas respecto al orificio de la boquilla.",
                    "La gota cae con inclinación."
                ],
                acciones: [
                    "Alinear y centrar el mecanismo de corte de la cizalla.",
                    "Ajustar el tubo y las guías de caída."
                ]
            },
            {
                id: "choque_termico",
                nombre: "Fisura por Choque Térmico (Thermal Shock Crack)",
                zona: "general",
                gravedad: "Crítico",
                descripcion: "Roturas o grietas grandes en las botellas que ocurren tras salir del túnel de recocido (Lehr).",
                causas: [
                    "Diferencia térmica extrema en el túnel de recocido.",
                    "Presencia de tensiones internas severas en el vidrio por enfriamiento muy rápido en la máquina IS."
                ],
                acciones: [
                    "Controlar la curva de temperaturas del Lehr (túnel de recocido).",
                    "Ajustar el templado y la velocidad de enfriamiento de la botella en el transportador."
                ]
            },
            {
                id: "deformacion_correa",
                nombre: "Deformación en Correa (Conveyor Deformation)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Aplastamientos u óvalos en el cuerpo del envase al chocar contra barandas o contra otras botellas.",
                causas: [
                    "Guiado tosco o barandas muy cerradas.",
                    "El vidrio se mantiene plástico por alta temperatura."
                ],
                acciones: [
                    "Alinear barandas del transportador y recubrirlas con material blando.",
                    "Disminuir la temperatura del vidrio."
                ]
            },
            {
                id: "vidrio_desvitrificado",
                nombre: "Vidrio Desvitrificado (Devitrified Glass)",
                zona: "general",
                gravedad: "Crítico",
                descripcion: "Zonas opacas, blanquecinas o rugosas en el envase por cristalización local del vidrio.",
                causas: [
                    "Composición química descompensada del vidrio (exceso de sílice o cal).",
                    "Permanencia prolongada del vidrio a temperatura de cristalización en el alimentador."
                ],
                acciones: [
                    "Ajustar la formulación química del vidrio (calcín e ingredientes).",
                    "Subir temperatura en las zonas frías del canal para fundir cristales."
                ]
            },
            {
                id: "lineas_tension",
                nombre: "Líneas de Tensión (Cord / Tension Lines)",
                zona: "general",
                gravedad: "Crítico",
                descripcion: "Líneas invisibles a simple vista (visibles con polaroscopio) que indican tensiones internas peligrosas que rompen el vidrio.",
                causas: [
                    "Mala homogeneización química o térmica del vidrio fundido.",
                    "Diferencias locales de viscosidad."
                ],
                acciones: [
                    "Ajustar los agitadores mecánicos del alimentador (stirrers).",
                    "Estabilizar la combustión del horno."
                ]
            },
            {
                id: "color_fuera_tono",
                nombre: "Color fuera de Tono (Color Tint Variation)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "El color final del vidrio no se ajusta al tono de la campaña estándar.",
                causas: [
                    "Dosificación incorrecta de colorantes (óxido de hierro, cobalto, selenio).",
                    "Atmósfera de combustión del horno muy reductora u oxidante."
                ],
                acciones: [
                    "Corregir el flujo de aditivos en el cargador.",
                    "Ajustar la relación aire/gas en los quemadores del horno."
                ]
            },
            {
                id: "astillas_sueltas",
                nombre: "Astillas de Vidrio en Interior (Loose Glass Splinters)",
                zona: "general",
                gravedad: "Crítico",
                descripcion: "Presencia de virutas, astillas o trozos sueltos de vidrio dentro de la botella.",
                causas: [
                    "Envases rotos aguas arriba en la cinta transportadora que salpican a otros.",
                    "Corte cizalla defectuoso."
                ],
                acciones: [
                    "Instalar un sistema de soplado/volteo de botellas para limpieza interna.",
                    "Mejorar el control e inspección automática en línea."
                ]
            },
            {
                id: "deformacion_takeout",
                nombre: "Deformación por Takeout (Takeout Mark)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Marcas o deformaciones en la boca o cuello causadas por las pinzas del extractor.",
                causas: [
                    "Las pinzas aprietan muy fuerte o abren a destiempo.",
                    "Las mordazas de la pinza están calientes o desgastadas."
                ],
                acciones: [
                    "Ajustar la presión neumática de cierre de la pinza.",
                    "Reemplazar los insertos de grafito de la pinza."
                ]
            },
            {
                id: "patinazo_correa",
                nombre: "Patinazo en Correa (Belt Scuffs)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Líneas grises o rayaduras horizontales en el cuerpo debido a fricción continua.",
                causas: [
                    "Velocidad del transportador descompensada con respecto a la máquina.",
                    "Guiado muy ajustado."
                ],
                acciones: [
                    "Sincronizar las velocidades de los transportadores.",
                    "Ajustar el ancho de las barandas de guía."
                ]
            },
            {
                id: "exceso_peso",
                nombre: "Exceso de Peso (Overweight)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La botella pesa más de la especificación tolerada, consumiendo más vidrio de lo presupuestado.",
                causas: [
                    "Gota de vidrio excesivamente pesada.",
                    "Regulación incorrecta del alimentador."
                ],
                acciones: [
                    "Subir el tubo del alimentador o regular la aguja para achicar la gota."
                ]
            },
            {
                id: "capacidad_incorrecta",
                nombre: "Capacidad Volumétrica Incorrecta",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La capacidad interna de la botella (en ml) no corresponde al volumen especificado para comercialización.",
                causas: [
                    "Espesor de pared excesivo (envase pesado).",
                    "Moldería con dimensiones internas incorrectas."
                ],
                acciones: [
                    "Verificar el peso del envase y ajustarlo.",
                    "Revisar el plano y las cotas de la moldería."
                ]
            },
            {
                id: "rebaba_cizalla",
                nombre: "Rebaba de Cizalla (Shear Mark Flange)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Una lengüeta de vidrio saliente en la base de la botella, justo sobre la cicatriz del corte.",
                causas: [
                    "Las cuchillas de la cizalla están desalineadas horizontalmente.",
                    "Falta de lubricación en la cizalla."
                ],
                acciones: [
                    "Ajustar la presión de corte y la superposición de las cuchillas.",
                    "Aumentar el caudal de agua de lubricación."
                ]
            },
            {
                id: "gota_fria",
                nombre: "Gota Fría (Cold Gob)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Una porción del envase queda opaca o incompleta por la caída de una gota con temperatura baja.",
                causas: [
                    "Baja temperatura en el tazón del alimentador o canal.",
                    "Quemadores apagados."
                ],
                acciones: [
                    "Encender o regular los quemadores del alimentador.",
                    "Verificar el control de temperatura automático del canal."
                ]
            },
            {
                id: "gota_caliente",
                nombre: "Gota Caliente (Hot Gob)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "La botella colapsa o se deforma plásticamente por ingresar una gota demasiado caliente y fluida.",
                causas: [
                    "Exceso de calor en el canal o tazón del alimentador."
                ],
                acciones: [
                    "Reducir la combustión en el canal del alimentador."
                ]
            },
            {
                id: "gota_larga",
                nombre: "Gota Larga (Long Gob)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Gota muy delgada y larga que cae enrollándose en el premolde, produciendo pliegues en espiral.",
                causas: [
                    "Ajuste inadecuado de la carrera de la aguja y temporización de la cizalla.",
                    "Vidrio muy caliente."
                ],
                acciones: [
                    "Disminuir la carrera de la aguja del alimentador.",
                    "Reducir temperatura del tazón."
                ]
            },
            {
                id: "gota_corta",
                nombre: "Gota Corta (Short Gob)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "Gota muy gruesa y corta que no alcanza a cargar adecuadamente la moldería de boca.",
                causas: [
                    "Aguja del alimentador muy arriba o carrera corta.",
                    "Vidrio frío."
                ],
                acciones: [
                    "Aumentar la carrera de la aguja.",
                    "Subir temperatura en el alimentador."
                ]
            },
            {
                id: "marca_aguja",
                nombre: "Marca de Aguja (Feeder Mark)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Una cicatriz opaca o estría en la parte interna del fondo del envase.",
                causas: [
                    "La aguja (plunger) del alimentador roza el orificio de la boquilla.",
                    "Aguja descentrada."
                ],
                acciones: [
                    "Centrar la aguja con respecto a la boquilla del alimentador."
                ]
            },
            {
                id: "vidrio_opaco",
                nombre: "Vidrio Opaco / Nublado (Cloudy Glass)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Pérdida de la transparencia cristalina del envase, viéndose nublado o turbio.",
                causas: [
                    "Presencia de humedad o gases reductores excesivos en el horno.",
                    "Contaminación en el calcín."
                ],
                acciones: [
                    "Mejorar el control del aire en la combustión del horno.",
                    "Controlar la procedencia y limpieza del calcín."
                ]
            },
            {
                id: "bajo_peso",
                nombre: "Bajo Peso (Underweight)",
                zona: "general",
                gravedad: "Mayor",
                descripcion: "El envase pesa menos de la especificación nominal, comprometiendo su espesor y resistencia.",
                causas: [
                    "Gota de vidrio de bajo peso.",
                    "Regulación del alimentador deficiente."
                ],
                acciones: [
                    "Ajustar el alimentador para incrementar el volumen de la gota."
                ]
            },
            {
                id: "marca_deflector",
                nombre: "Marca de Deflector (Deflector Mark)",
                zona: "general",
                gravedad: "Menor",
                descripcion: "Líneas oscuras o rugosas en el hombro de la botella por fricción durante la entrega de la gota.",
                causas: [
                    "Deflectores del canal de entrega sucios, desalineados o sin grafito."
                ],
                acciones: [
                    "Limpiar y pintar con grafito seco los deflectores de la sección."
                ]
            }
];
