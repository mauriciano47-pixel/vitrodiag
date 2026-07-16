import { state } from './state.js';
import { mostrarResultadoDefecto } from './geometry.js';

function startProcessing() {
            state.streamActive = true;
            
            const initCanvasSize = () => {
                if (video.videoWidth > 0) {
                    const videoAspect = video.videoWidth / video.videoHeight;
                    let targetWidth = 320;
                    let targetHeight = Math.round(targetWidth / videoAspect);
                    offscreenCanvas.width = targetWidth;
                    offscreenCanvas.height = targetHeight;
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                } else {
                    canvas.width = 320;
                    canvas.height = 240;
                    offscreenCanvas.width = 320;
                    offscreenCanvas.height = 240;
                }
            };

            if (video.readyState >= 1) {
                initCanvasSize();
            } else {
                video.addEventListener('loadedmetadata', initCanvasSize, { once: true });
            }
            
            state.animationFrameId = requestAnimationFrame(processFrame);
        }

function stopProcessing() {
            state.streamActive = false;
            if (state.animationFrameId) {
                cancelAnimationFrame(state.animationFrameId);
                state.animationFrameId = null;
            }
        }

function processFrame() {
            if (!state.streamActive) return;
            
            try {
                // Ajustar dinámicamente el tamaño del canvas según la relación de aspecto real de la cámara
                if (video.videoWidth > 0) {
                    const videoAspect = video.videoWidth / video.videoHeight;
                    let targetWidth = 320;
                    let targetHeight = Math.round(targetWidth / videoAspect);
                    
                    if (offscreenCanvas.width !== targetWidth || offscreenCanvas.height !== targetHeight) {
                        offscreenCanvas.width = targetWidth;
                        offscreenCanvas.height = targetHeight;
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                    }
                }

                // 1. Pintar el frame de video en canvas oculto de baja resolución
                offscreenCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
                const imgData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                const data = imgData.data;
                const width = imgData.width;
                const height = imgData.height;

                // OBTENER VALORES DE LOS DESLIZADORES DE CALIBRACIÓN EN CALIENTE
                const alpha = parseFloat(sliderContrast.value);      // Contraste (1.0 - 3.0)
                const beta = parseInt(sliderBrightness.value);       // Brillo (-50 - 50)
                const threshold = parseInt(sliderCanny.value);       // Umbral de detección

                // Crear escala de grises preprocesada
                const gray = new Uint8ClampedArray(width * height);
                for (let i = 0; i < data.length; i += 4) {
                    let r = data[i];
                    let g = data[i+1];
                    let b = data[i+2];

                    // Ajuste de contraste y brillo
                    r = Math.min(255, Math.max(0, alpha * r + beta));
                    g = Math.min(255, Math.max(0, alpha * g + beta));
                    b = Math.min(255, Math.max(0, alpha * b + beta));

                    gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
                }

                // Buffer de salida
                const outputImgData = ctx.createImageData(canvas.width, canvas.height);
                const outData = outputImgData.data;
                
                const scaleX = canvas.width / width;
                const scaleY = canvas.height / height;

                // Estructuras para el análisis de simetría
                const borders = new Uint8ClampedArray(width * height);

                // --- MODO 3: SIMULACIÓN TÉRMICA (MAPA DE CALOR) ---
                if (state.currentVisionMode === 'thermal') {
                    // Mapeo directo del canal de escala de grises a una rampa de color térmica
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const val = gray[y*width + x];
                            
                            // Mapear escala de grises 0-255 a mapa de calor (Azul -> Verde -> Amarillo -> Rojo -> Blanco)
                            let r = 0, g = 0, b = 0;
                            
                            if (val < 64) {
                                // Azul a cian
                                b = 255;
                                g = val * 4;
                            } else if (val < 128) {
                                // Cian a verde/amarillo
                                g = 255;
                                b = 255 - (val - 64) * 4;
                                r = (val - 64) * 2;
                            } else if (val < 192) {
                                // Amarillo a rojo
                                r = 255;
                                g = 255 - (val - 128) * 4;
                            } else {
                                // Rojo a blanco incandescente (vidrio fundido)
                                r = 255;
                                g = (val - 192) * 4;
                                b = (val - 192) * 4;
                            }

                            // Mapear píxel al canvas principal de alta resolución
                            const targetX = Math.floor(x * scaleX);
                            const targetY = Math.floor(y * scaleY);
                            
                            // Pintar bloque de 2x2 para rellenar
                            for (let dy = 0; dy < 2; dy++) {
                                for (let dx = 0; dx < 2; dx++) {
                                    const px = targetX + dx;
                                    const py = targetY + dy;
                                    if (px < canvas.width && py < canvas.height) {
                                        const idx = (py * canvas.width + px) * 4;
                                        outData[idx] = r;
                                        outData[idx+1] = g;
                                        outData[idx+2] = b;
                                        outData[idx+3] = 255; // Opaco
                                    }
                                }
                            }
                        }
                    }
                    
                    // En modo térmico no hay análisis de simetría clásico
                    state.lastProcessedBorders = null;

                } else {
                    // --- MODOS DE CONTORNO (FINE O SOBEL) ---

                    // 1. Si es modo 'backlight' (Mesa de Luz), aplicamos binarización adaptativa y compensación morfológica
                    const blurred = new Uint8ClampedArray(width * height);
                    const isBacklight = document.getElementById('backlightToggle') && document.getElementById('backlightToggle').checked;
                    
                    if (isBacklight) {
                        // A. Detección Dinámica de Fondo (Esquinas)
                        let cornerSum = 0;
                        let cornerCount = 0;
                        const dSize = 8;
                        // Esquina superior izquierda
                        for (let y = 0; y < dSize; y++) {
                            for (let x = 0; x < dSize; x++) {
                                cornerSum += gray[y * width + x];
                                cornerCount++;
                            }
                        }
                        // Esquina superior derecha
                        for (let y = 0; y < dSize; y++) {
                            for (let x = width - dSize; x < width; x++) {
                                cornerSum += gray[y * width + x];
                                cornerCount++;
                            }
                        }
                        // Esquina inferior izquierda
                        for (let y = height - dSize; y < height; y++) {
                            for (let x = 0; x < dSize; x++) {
                                cornerSum += gray[y * width + x];
                                cornerCount++;
                            }
                        }
                        // Esquina inferior derecha
                        for (let y = height - dSize; y < height; y++) {
                            for (let x = width - dSize; x < width; x++) {
                                cornerSum += gray[y * width + x];
                                cornerCount++;
                            }
                        }
                        const backlightLevel = cornerCount > 0 ? (cornerSum / cornerCount) : 240;
                        
                        // B. Binarización Adaptativa (Filtro Contraluz)
                        const bThreshold = Math.max(120, backlightLevel - 50);
                        const binary = new Uint8ClampedArray(width * height);
                        for (let i = 0; i < width * height; i++) {
                            binary[i] = gray[i] < bThreshold ? 255 : 0;
                        }
                        
                        // C. Filtro Morfológico de Dilatación (Compensación de Silueta ante sobreexposición)
                        const dilated = new Uint8ClampedArray(width * height);
                        dilated.set(binary);
                        if (backlightLevel > 230) {
                            for (let y = 1; y < height - 1; y++) {
                                for (let x = 1; x < width - 1; x++) {
                                    if (binary[y * width + x] === 0) {
                                        if (binary[(y-1)*width + x] === 255 || 
                                            binary[(y+1)*width + x] === 255 || 
                                            binary[y*width + (x-1)] === 255 || 
                                            binary[y*width + (x+1)] === 255) {
                                            dilated[y * width + x] = 255;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Alimentar la silueta binarizada limpia a la detección de bordes
                        blurred.set(dilated);
                    } else {
                        // Flujo normal sin modo Backlight
                        if (state.currentVisionMode === 'fine') {
                            for (let y = 1; y < height - 1; y++) {
                                for (let x = 1; x < width - 1; x++) {
                                    let sum = 0;
                                    for (let ky = -1; ky <= 1; ky++) {
                                        for (let kx = -1; kx <= 1; kx++) {
                                            sum += gray[(y + ky) * width + (x + kx)];
                                        }
                                    }
                                    blurred[y * width + x] = Math.floor(sum / 9);
                                }
                            }
                        } else {
                            // En modo Sobel normal, no desenfocamos para mantener la costura cruda
                            blurred.set(gray);
                        }
                    }

                    // Buffers de gradiente
                    const mag = new Float32Array(width * height);
                    const angle = new Float32Array(width * height);

                    // 2. Ejecutar convolución de Sobel
                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            const gx = 
                                -1 * blurred[(y-1)*width + (x-1)] + 1 * blurred[(y-1)*width + (x+1)] +
                                -2 * blurred[ y   *width + (x-1)] + 2 * blurred[ y   *width + (x+1)] +
                                -1 * blurred[(y+1)*width + (x-1)] + 1 * blurred[(y+1)*width + (x+1)];

                            const gy = 
                                -1 * blurred[(y-1)*width + (x-1)] - 2 * blurred[(y-1)*width + x] - 1 * blurred[(y-1)*width + (x+1)] +
                                 1 * blurred[(y+1)*width + (x-1)] + 2 * blurred[(y+1)*width + x] + 1 * blurred[(y+1)*width + (x+1)];

                            mag[y*width + x] = Math.sqrt(gx*gx + gy*gy);
                            angle[y*width + x] = Math.atan2(gy, gx);
                        }
                    }

                    // 3. Procesamiento y renderizado en el canvas de salida
                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            let magnitude = mag[y*width + x];

                            if (magnitude > threshold) {
                                let isMax = true;

                                // Si el modo es 'fine' (Silueta Fina), aplicamos la supresión de no-máximos local
                                if (state.currentVisionMode === 'fine') {
                                    let ang = angle[y*width + x] * (180 / Math.PI);
                                    if (ang < 0) ang += 180;

                                    let n1 = 0, n2 = 0;
                                    // Determinar vecinos en la dirección del gradiente
                                    if ((ang >= 0 && ang < 22.5) || (ang >= 157.5 && ang <= 180)) {
                                        // Dirección horizontal
                                        n1 = mag[y*width + (x-1)];
                                        n2 = mag[y*width + (x+1)];
                                    } else if (ang >= 22.5 && ang < 67.5) {
                                        // Diagonal arriba-derecha
                                        n1 = mag[(y-1)*width + (x-1)];
                                        n2 = mag[(y+1)*width + (x+1)];
                                    } else if (ang >= 67.5 && ang < 112.5) {
                                        // Dirección vertical
                                        n1 = mag[(y-1)*width + x];
                                        n2 = mag[(y+1)*width + x];
                                    } else {
                                        // Diagonal arriba-izquierda
                                        n1 = mag[(y-1)*width + (x+1)];
                                        n2 = mag[(y+1)*width + (x-1)];
                                    }

                                    // Si no es el pico local en su dirección, se descarta (supresión)
                                    if (magnitude < n1 || magnitude < n2) {
                                        isMax = false;
                                    }
                                }

                                if (isMax) {
                                    borders[y*width + x] = 255;

                                    const targetX = Math.floor(x * scaleX);
                                    const targetY = Math.floor(y * scaleY);
                                    
                                    // Pintar contorno en naranja neón
                                    const thickness = (state.currentVisionMode === 'fine') ? 1 : 2; // Línea de 1px en silueta fina
                                    for (let dy = 0; dy < thickness; dy++) {
                                        for (let dx = 0; dx < thickness; dx++) {
                                            const px = targetX + dx;
                                            const py = targetY + dy;
                                            if (px < canvas.width && py < canvas.height) {
                                                const idx = (py * canvas.width + px) * 4;
                                                outData[idx] = 255;     // R
                                                outData[idx+1] = 111;   // G
                                                outData[idx+2] = 0;     // B
                                                outData[idx+3] = 255;   // A
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Guardar los datos de bordes para el análisis geométrico de simetría
                    state.lastProcessedBorders = borders;
                    state.lastBordersWidth = width;
                    state.lastBordersHeight = height;
                }

                // Pintar la imagen en el canvas principal
                ctx.putImageData(outputImgData, 0, 0);

                // --- DIBUJAR PLANTILLA GUÍA TRANSLÚCIDA (BOTELLA PATRÓN) ---
                if (state.currentVisionMode === 'fine') {
                    const scale = parseFloat(sliderTemplateScale.value) || 1.0;
                    const w = canvas.width;
                    const h = canvas.height;
                    const midX = w / 2;

                    ctx.strokeStyle = "rgba(6, 182, 212, 0.45)"; // Cyan semitransparente de alta visibilidad en caliente
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([5, 4]); // Línea discontinua técnica para moldería
                    
                    // Definir las dimensiones relativas de la botella patrón según la escala
                    const bocaW = 28 * scale;
                    const cuelloW = 22 * scale;
                    const cuerpoW = 68 * scale;
                    const fondoW = 60 * scale;

                    const bocaTopY = h * 0.05;
                    const bocaBotY = h * 0.16;
                    const hombroY = h * 0.38;
                    const fondoTopY = h * 0.82;
                    const fondoBotY = h * 0.94;

                    ctx.beginPath();
                    
                    // 1. Boca (Corona del envase)
                    ctx.moveTo(midX - bocaW, bocaTopY);
                    ctx.lineTo(midX + bocaW, bocaTopY);
                    ctx.lineTo(midX + bocaW, bocaBotY);
                    
                    // 2. Cuello (En embudo)
                    ctx.lineTo(midX + cuelloW, hombroY);
                    
                    // 3. Cuerpo (Cilíndrico)
                    ctx.lineTo(midX + cuerpoW, hombroY + 10);
                    ctx.lineTo(midX + cuerpoW, fondoTopY);
                    
                    // 4. Asiento/Fondo
                    ctx.quadraticCurveTo(midX + fondoW, fondoBotY, midX, fondoBotY);
                    ctx.quadraticCurveTo(midX - fondoW, fondoBotY, midX - cuerpoW, fondoTopY);
                    
                    // 5. Cuerpo Izquierdo
                    ctx.lineTo(midX - cuerpoW, hombroY + 10);
                    ctx.lineTo(midX - cuelloW, hombroY);
                    
                    // 6. Cuello Izquierdo y Corona
                    ctx.lineTo(midX - bocaW, bocaBotY);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.setLineDash([]); // Resetear patrón de línea
                    
                    // Dibujar el eje central ideal (Línea de alineación fina)
                    ctx.strokeStyle = "rgba(16, 185, 129, 0.35)"; // Verde de alineación centrado
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(midX, 0);
                    ctx.lineTo(midX, h);
                    ctx.stroke();
                }

                state.animationFrameId = requestAnimationFrame(processFrame);
            } catch (err) {
                console.error("Error en frame de vision nativa mejorada: ", err);
                state.animationFrameId = requestAnimationFrame(processFrame);
            }
        }

export function setVisionMode(mode) {
    state.state.currentVisionMode = mode;
    const tabFine = document.getElementById('tabModeFine');
    const tabSobel = document.getElementById('tabModeSobel');
    const tabThermal = document.getElementById('tabModeThermal');
    const demoText = document.getElementById('demoText');
    const demoVisual = document.getElementById('demoVisual');
    
    if (tabFine && tabSobel && tabThermal) {
        tabFine.classList.remove('active');
        tabSobel.classList.remove('active');
        tabThermal.classList.remove('active');
        
        if (mode === 'fine') tabFine.classList.add('active');
        else if (mode === 'sobel') tabSobel.classList.add('active');
        else if (mode === 'thermal') tabThermal.classList.add('active');
    }
    
    if (demoText && demoVisual) {
        if (mode === 'fine') {
            demoText.innerHTML = "<b>Silueta Fina (Contorno Técnico)</b><br>Busca variaciones y picos locales en el cuello o la boca para detectar rebabas o cuellos torcidos.";
            demoVisual.style.borderColor = "var(--success)";
        } else if (mode === 'sobel') {
            demoText.innerHTML = "<b>Filtro Sobel (Bordes Físicos)</b><br>Resalta los cambios de gradiente óptico para evaluar el grosor del vidrio y costuras.";
            demoVisual.style.borderColor = "var(--warning)";
        } else if (mode === 'thermal') {
            demoText.innerHTML = "<b>Simulación Térmica (Temperatura)</b><br>Mapea la intensidad de luz del parison a una rampa de color para simular la distribución de calor.";
            demoVisual.style.borderColor = "var(--danger)";
        }
    }
}

export { startProcessing, stopProcessing, processFrame };
