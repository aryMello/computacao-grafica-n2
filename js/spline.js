/**
 * Módulo de B-Splines
 * Implementa interpolação B-Spline cúbica uniforme
 */

export class BSpline {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.degree = 3;
        this.step = 0.01;
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
        this.draw();
    }

    removePoint(index) {
        this.points.splice(index, 1);
        this.draw();
    }

    updatePointCoordinate(index, coord, value) {
        this.points[index][coord] = parseFloat(value);
        this.draw();
    }

    setDegree(degree) {
        this.degree = parseInt(degree);
        this.draw();
    }

    setStep(step) {
        this.step = parseFloat(step);
        this.draw();
    }

    clear() {
        this.points = [];
        this.draw();
    }

    /**
     * Gera vetor de nós uniforme
     * @returns {array} Vetor de nós
     */
    generateKnotVector() {
        const n = this.points.length;
        const m = n + this.degree + 1;
        const knots = [];
        
        // Vetor de nós uniforme aberto
        for (let i = 0; i < m; i++) {
            if (i < this.degree + 1) {
                knots.push(0);
            } else if (i > n) {
                knots.push(n - this.degree);
            } else {
                knots.push(i - this.degree);
            }
        }
        
        return knots;
    }

    /**
     * Função base de Cox-de Boor
     * @param {number} i - Índice da função base
     * @param {number} p - Grau
     * @param {number} u - Parâmetro
     * @param {array} knots - Vetor de nós
     * @returns {number} Valor da função base
     */
    basisFunction(i, p, u, knots) {
        if (p === 0) {
            return (knots[i] <= u && u < knots[i + 1]) ? 1.0 : 0.0;
        }

        let left = 0.0;
        let right = 0.0;

        const denomLeft = knots[i + p] - knots[i];
        if (Math.abs(denomLeft) > 1e-10) {
            left = ((u - knots[i]) / denomLeft) * this.basisFunction(i, p - 1, u, knots);
        }

        const denomRight = knots[i + p + 1] - knots[i + 1];
        if (Math.abs(denomRight) > 1e-10) {
            right = ((knots[i + p + 1] - u) / denomRight) * this.basisFunction(i + 1, p - 1, u, knots);
        }

        return left + right;
    }

    /**
     * Calcula ponto na B-Spline
     * @param {number} u - Parâmetro
     * @returns {object} Ponto {x, y}
     */
    evaluateAt(u) {
        const n = this.points.length;
        if (n === 0) return null;
        if (n === 1) return this.points[0];

        const knots = this.generateKnotVector();
        let x = 0;
        let y = 0;

        for (let i = 0; i < n; i++) {
            const basis = this.basisFunction(i, this.degree, u, knots);
            x += basis * this.points[i].x;
            y += basis * this.points[i].y;
        }

        return { x, y };
    }

    /**
     * Gera pontos da B-Spline
     * @returns {array} Array de pontos
     */
    generateCurve() {
        const n = this.points.length;
        if (n < this.degree + 1) return [];

        const curvePoints = [];
        const maxU = n - this.degree;
        
        for (let u = 0; u <= maxU; u += this.step) {
            const point = this.evaluateAt(u);
            if (point) curvePoints.push(point);
        }
        
        // Garantir ponto final
        const finalPoint = this.evaluateAt(maxU);
        if (finalPoint) curvePoints.push(finalPoint);

        return curvePoints;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.points.length === 0) return;

        // Desenhar polígono de controle
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

        // Desenhar B-Spline
        if (this.points.length >= this.degree + 1) {
            const curvePoints = this.generateCurve();
            
            if (curvePoints.length > 0) {
                this.ctx.strokeStyle = '#e74c3c';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
                for (let i = 1; i < curvePoints.length; i++) {
                    this.ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
                }
                this.ctx.stroke();
            }
        }

        // Desenhar pontos de controle
        this.points.forEach((point, i) => {
            this.ctx.fillStyle = '#c0392b';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Desenhar número do ponto
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(`P${i}`, point.x + 10, point.y - 10);
        });

        // Aviso se poucos pontos
        if (this.points.length > 0 && this.points.length < this.degree + 1) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '14px sans-serif';
            this.ctx.fillText(
                `Adicione pelo menos ${this.degree + 1} pontos (grau ${this.degree})`,
                10, 20
            );
        }
    }

    exportJSON() {
        return {
            type: 'bspline',
            degree: this.degree,
            step: this.step,
            controlPoints: this.points,
            knotVector: this.generateKnotVector(),
            timestamp: new Date().toISOString()
        };
    }

    importPoints(points) {
        this.points = points.map(p => ({...p}));
        this.draw();
    }
}