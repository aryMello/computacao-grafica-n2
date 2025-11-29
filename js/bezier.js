/**
 * Módulo de Curvas de Bézier
 * Implementa algoritmo de De Casteljau para geração de curvas de Bézier
 */

export class BezierCurve {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.weights = [];
        this.selectedPoint = null;
        this.isDragging = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Verificar se clicou em um ponto existente
        for (let i = 0; i < this.points.length; i++) {
            const dx = x - this.points[i].x;
            const dy = y - this.points[i].y;
            if (Math.sqrt(dx * dx + dy * dy) < 10) {
                this.selectedPoint = i;
                this.isDragging = true;
                return;
            }
        }

        // Adicionar novo ponto
        this.addPoint(x, y);
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedPoint !== null) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.points[this.selectedPoint] = { x, y };
            this.draw();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.selectedPoint = null;
    }

    addPoint(x, y) {
        this.points.push({ x, y });
        this.weights.push(1.0);
        this.draw();
    }

    removePoint(index) {
        this.points.splice(index, 1);
        this.weights.splice(index, 1);
        this.draw();
    }

    updateWeight(index, weight) {
        this.weights[index] = parseFloat(weight);
        this.draw();
    }

    updatePointCoordinate(index, coord, value) {
        this.points[index][coord] = parseFloat(value);
        this.draw();
    }

    clear() {
        this.points = [];
        this.weights = [];
        this.draw();
    }

    /**
     * Algoritmo de De Casteljau para calcular ponto na curva de Bézier
     * @param {number} t - Parâmetro t [0, 1]
     * @returns {object} Ponto {x, y} na curva
     */
    deCasteljau(t) {
        if (this.points.length === 0) return null;
        if (this.points.length === 1) return this.points[0];

        // Criar cópia dos pontos ponderados
        let tempPoints = this.points.map((p, i) => ({
            x: p.x * this.weights[i],
            y: p.y * this.weights[i],
            w: this.weights[i]
        }));

        // Aplicar De Casteljau
        while (tempPoints.length > 1) {
            const newPoints = [];
            for (let i = 0; i < tempPoints.length - 1; i++) {
                const p0 = tempPoints[i];
                const p1 = tempPoints[i + 1];
                
                newPoints.push({
                    x: (1 - t) * p0.x + t * p1.x,
                    y: (1 - t) * p0.y + t * p1.y,
                    w: (1 - t) * p0.w + t * p1.w
                });
            }
            tempPoints = newPoints;
        }

        // Normalizar pelo peso final
        const final = tempPoints[0];
        return {
            x: final.x / final.w,
            y: final.y / final.w
        };
    }

    /**
     * Gera pontos da curva de Bézier
     * @param {number} steps - Número de passos
     * @returns {array} Array de pontos
     */
    generateCurve(steps = 100) {
        const curvePoints = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const point = this.deCasteljau(t);
            if (point) curvePoints.push(point);
        }
        return curvePoints;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.points.length === 0) return;

        // Desenhar linhas de controle
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            this.ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Desenhar curva de Bézier
        if (this.points.length >= 2) {
            const curvePoints = this.generateCurve(200);
            
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
            for (let i = 1; i < curvePoints.length; i++) {
                this.ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
            }
            this.ctx.stroke();
        }

        // Desenhar pontos de controle
        this.points.forEach((point, i) => {
            this.ctx.fillStyle = '#764ba2';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Desenhar número do ponto
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(`P${i}`, point.x + 10, point.y - 10);
        });
    }

    exportJSON() {
        return {
            type: 'bezier',
            degree: this.points.length - 1,
            controlPoints: this.points,
            weights: this.weights,
            timestamp: new Date().toISOString()
        };
    }

    importPoints(points, weights = null) {
        this.points = points.map(p => ({...p}));
        this.weights = weights ? [...weights] : points.map(() => 1.0);
        this.draw();
    }
}