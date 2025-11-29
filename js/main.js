/**
 * Arquivo principal - Integração de todos os módulos
 * Gerencia tabs, controles e eventos da interface
 */

import { BezierCurve } from './bezier.js';
import { BSpline } from './spline.js';
import { RevolutionSurface } from './revolution.js';
import { AlusFlight } from './alus.js';

class GraphicsApp {
    constructor() {
        this.bezier = null;
        this.spline = null;
        this.revolution = null;
        this.alus = null;
        
        this.init();
    }

    init() {
        this.setupTabs();
        this.initializeBezier();
        this.initializeSpline();
        this.initializeRevolution();
        this.initializeAlus();
    }

    /**
     * Configuração do sistema de tabs
     */
    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab;

                // Remover classe active de todas as tabs
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));

                // Adicionar classe active na tab clicada
                tab.classList.add('active');
                document.getElementById(targetId).classList.add('active');
                
                // Redimensionar canvas 3D quando necessário
                if (targetId === 'revolution' && this.revolution) {
                    setTimeout(() => {
                        this.revolution.handleResize();
                    }, 50);
                }
                
                if (targetId === 'alus' && this.alus) {
                    setTimeout(() => {
                        this.alus.handleResize();
                    }, 50);
                }
            });
        });
    }

    /**
     * Inicialização do módulo de Bézier
     */
    initializeBezier() {
        const canvas = document.getElementById('bezierCanvas');
        this.bezier = new BezierCurve(canvas);

        // Botão limpar
        document.getElementById('clearBezier').addEventListener('click', () => {
            this.bezier.clear();
            this.updateBezierPointsList();
        });

        // Botão exportar
        document.getElementById('exportBezier').addEventListener('click', () => {
            const data = this.bezier.exportJSON();
            this.downloadJSON(data, 'bezier_curve.json');
        });

        // Atualizar lista de pontos quando desenhar
        const originalDraw = this.bezier.draw.bind(this.bezier);
        this.bezier.draw = () => {
            originalDraw();
            this.updateBezierPointsList();
        };

        this.updateBezierPointsList();
    }

    updateBezierPointsList() {
        const container = document.getElementById('bezierPoints');
        const degree = this.bezier.points.length > 0 ? this.bezier.points.length - 1 : 0;
        document.getElementById('bezierDegree').textContent = degree;

        let html = '<h4>Pontos de Controle</h4>';
        
        this.bezier.points.forEach((point, i) => {
            html += `
                <div class="point-item">
                    <span>P${i}:</span>
                    <input type="number" value="${point.x.toFixed(1)}" 
                           onchange="app.bezier.updatePointCoordinate(${i}, 'x', this.value); app.bezier.draw()">
                    <input type="number" value="${point.y.toFixed(1)}" 
                           onchange="app.bezier.updatePointCoordinate(${i}, 'y', this.value); app.bezier.draw()">
                    <label style="font-size: 0.85rem; margin: 0 5px;">Peso:</label>
                    <input type="number" value="${this.bezier.weights[i].toFixed(2)}" step="0.1" min="0.1"
                           style="width: 50px;"
                           onchange="app.bezier.updateWeight(${i}, this.value); app.bezier.draw()">
                    <button onclick="app.bezier.removePoint(${i}); app.bezier.draw()">✕</button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Inicialização do módulo de Spline
     */
    initializeSpline() {
        const canvas = document.getElementById('splineCanvas');
        this.spline = new BSpline(canvas);

        // Botão limpar
        document.getElementById('clearSpline').addEventListener('click', () => {
            this.spline.clear();
            this.updateSplinePointsList();
        });

        // Botão exportar
        document.getElementById('exportSpline').addEventListener('click', () => {
            const data = this.spline.exportJSON();
            this.downloadJSON(data, 'bspline_curve.json');
        });

        // Botão usar pontos de Bézier
        document.getElementById('useBezierPoints').addEventListener('click', () => {
            if (this.bezier.points.length > 0) {
                this.spline.importPoints(this.bezier.points);
                this.updateSplinePointsList();
            } else {
                alert('Nenhum ponto de Bézier para importar!');
            }
        });

        // Controle de grau
        const degreeSlider = document.getElementById('splineDegree');
        const degreeValue = document.getElementById('splineDegreeValue');
        degreeSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            degreeValue.textContent = value;
            this.spline.setDegree(value);
        });

        // Controle de passo
        const stepSlider = document.getElementById('splineStep');
        const stepValue = document.getElementById('splineStepValue');
        stepSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            stepValue.textContent = value;
            this.spline.setStep(value);
        });

        // Atualizar lista de pontos
        const originalDraw = this.spline.draw.bind(this.spline);
        this.spline.draw = () => {
            originalDraw();
            this.updateSplinePointsList();
        };

        this.updateSplinePointsList();
    }

    updateSplinePointsList() {
        const container = document.getElementById('splinePoints');
        
        let html = '<h4>Pontos de Controle</h4>';
        
        this.spline.points.forEach((point, i) => {
            html += `
                <div class="point-item">
                    <span>P${i}:</span>
                    <input type="number" value="${point.x.toFixed(1)}" 
                           onchange="app.spline.updatePointCoordinate(${i}, 'x', this.value); app.spline.draw()">
                    <input type="number" value="${point.y.toFixed(1)}" 
                           onchange="app.spline.updatePointCoordinate(${i}, 'y', this.value); app.spline.draw()">
                    <button onclick="app.spline.removePoint(${i}); app.spline.draw()">✕</button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Inicialização do módulo de Revolução
     */
    initializeRevolution() {
        const canvas2D = document.getElementById('revolutionCanvas2D');
        const container3D = document.getElementById('revolution3D');
        this.revolution = new RevolutionSurface(canvas2D, container3D);

        // Botão limpar
        document.getElementById('clearRevolution').addEventListener('click', () => {
            this.revolution.clear();
        });

        // Botão gerar superfície
        document.getElementById('generateSurface').addEventListener('click', () => {
            if (this.revolution.points.length < 2) {
                alert('Adicione pelo menos 2 pontos de controle!');
                return;
            }
            this.revolution.generateSurface();
        });

        // Botão exportar OBJ
        document.getElementById('exportRevolution').addEventListener('click', () => {
            const obj = this.revolution.exportOBJ();
            if (obj) {
                this.downloadFile(obj, 'surface.obj', 'text/plain');
            } else {
                alert('Gere uma superfície primeiro!');
            }
        });

        // Tipo de curva
        document.getElementById('revolutionCurveType').addEventListener('change', (e) => {
            this.revolution.setCurveType(e.target.value);
        });

        // Eixo de revolução
        document.getElementById('revolutionAxis').addEventListener('change', (e) => {
            this.revolution.setAxis(e.target.value);
        });

        // Ângulo
        const angleSlider = document.getElementById('revolutionAngle');
        const angleValue = document.getElementById('revolutionAngleValue');
        angleSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            angleValue.textContent = value + '°';
            this.revolution.setAngle(value);
        });

        // Segmentos
        const segmentsSlider = document.getElementById('revolutionSegments');
        const segmentsValue = document.getElementById('revolutionSegmentsValue');
        segmentsSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            segmentsValue.textContent = value;
            this.revolution.setSegments(value);
        });

        // Modo de visualização
        document.getElementById('revolutionViewMode').addEventListener('change', (e) => {
            this.revolution.setViewMode(e.target.value);
        });

        this.revolution.draw2D();
    }

    /**
     * Inicialização do módulo Alus
     */
    initializeAlus() {
        const container3D = document.getElementById('alus3D');
        this.alus = new AlusFlight(container3D);

        // Botão iniciar voo
        document.getElementById('startAlusFlight').addEventListener('click', () => {
            this.alus.startFlight();
            this.startAlusStatusUpdate();
        });

        // Botão parar
        document.getElementById('stopAlusFlight').addEventListener('click', () => {
            this.alus.stopFlight();
        });

        // Botão resetar
        document.getElementById('resetAlusFlight').addEventListener('click', () => {
            this.alus.resetFlight();
            this.updateAlusStatus();
        });

        // Direção
        document.getElementById('alusDirection').addEventListener('change', (e) => {
            this.alus.setDirection(e.target.value);
        });

        // Ciclos
        const cyclesSlider = document.getElementById('alusCycles');
        const cyclesValue = document.getElementById('alusCyclesValue');
        cyclesSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            cyclesValue.textContent = value;
            this.alus.setCycles(value);
        });

        // Velocidade
        const speedSlider = document.getElementById('alusSpeed');
        const speedValue = document.getElementById('alusSpeedValue');
        speedSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            speedValue.textContent = value + 'x';
            this.alus.setSpeed(value);
        });

        // Taxa de subida
        const climbSlider = document.getElementById('alusClimbRate');
        const climbValue = document.getElementById('alusClimbRateValue');
        climbSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            climbValue.textContent = value;
            this.alus.setClimbRate(value);
        });

        // Taxa de descida
        const descentSlider = document.getElementById('alusDescentRate');
        const descentValue = document.getElementById('alusDescentRateValue');
        descentSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            descentValue.textContent = value;
            this.alus.setDescentRate(value);
        });
    }

    startAlusStatusUpdate() {
        if (this.alusStatusInterval) {
            clearInterval(this.alusStatusInterval);
        }

        this.alusStatusInterval = setInterval(() => {
            this.updateAlusStatus();
            
            if (!this.alus.isFlying) {
                clearInterval(this.alusStatusInterval);
            }
        }, 100);
    }

    updateAlusStatus() {
        const status = this.alus.getStatus();
        document.getElementById('alusAltitude').textContent = status.altitude;
        document.getElementById('alusPosition').textContent = status.position + '%';
        document.getElementById('alusState').textContent = status.state;
    }

    /**
     * Utilitários de exportação
     */
    downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, filename, 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Inicializar aplicação quando DOM carregar
window.addEventListener('DOMContentLoaded', () => {
    window.app = new GraphicsApp();
});

// Expor app globalmente para uso nos event handlers inline
window.app = null;