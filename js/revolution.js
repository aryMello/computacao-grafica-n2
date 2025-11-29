/**
 * Módulo de Superfície de Revolução
 * Gera superfícies 3D por revolução de perfis 2D
 */

import { BezierCurve } from './bezier.js';
import { BSpline } from './spline.js';

export class RevolutionSurface {
    constructor(canvas2D, container3D) {
        this.canvas2D = canvas2D;
        this.ctx = canvas2D.getContext('2d');
        this.container3D = container3D;
        
        this.points = [];
        this.curveType = 'bezier';
        this.axis = 'y';
        this.angle = 360;
        this.segments = 32;
        this.viewMode = 'solid';
        
        this.selectedPoint = null;
        this.isDragging = false;
        
        this.setupCanvas2D();
        this.setup3D();
    }

    setupCanvas2D() {
        this.canvas2D.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas2D.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas2D.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas2D.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    setup3D() {
        // Configurar cena Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Câmera
        const aspect = this.container3D.clientWidth / this.container3D.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(5, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container3D.clientWidth, this.container3D.clientHeight);
        this.container3D.appendChild(this.renderer.domElement);
        
        // Iluminação
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
        
        // Eixos
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        // Grid
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);
        
        // Controles de mouse
        this.setupMouseControls();
        
        // Mesh da superfície
        this.surfaceMesh = null;
        this.wireframeMesh = null;
        
        this.animate();
    }

    setupMouseControls() {
        let isRotating = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isRotating = true;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isRotating) {
                const deltaX = e.offsetX - previousMousePosition.x;
                const deltaY = e.offsetY - previousMousePosition.y;
                
                this.camera.position.x += deltaX * 0.05;
                this.camera.position.y -= deltaY * 0.05;
                this.camera.lookAt(0, 0, 0);
            }
            
            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isRotating = false;
        });
        
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * 0.01;
            const distance = this.camera.position.length();
            const newDistance = Math.max(2, Math.min(50, distance + delta));
            const factor = newDistance / distance;
            this.camera.position.multiplyScalar(factor);
        });
    }

    handleMouseDown(e) {
        const rect = this.canvas2D.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let i = 0; i < this.points.length; i++) {
            const dx = x - this.points[i].x;
            const dy = y - this.points[i].y;
            if (Math.sqrt(dx * dx + dy * dy) < 10) {
                this.selectedPoint = i;
                this.isDragging = true;
                return;
            }
        }

        this.addPoint(x, y);
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedPoint !== null) {
            const rect = this.canvas2D.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.points[this.selectedPoint] = { x, y };
            this.draw2D();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.selectedPoint = null;
    }

    addPoint(x, y) {
        this.points.push({ x, y });
        this.draw2D();
    }

    removePoint(index) {
        this.points.splice(index, 1);
        this.draw2D();
    }

    clear() {
        this.points = [];
        this.draw2D();
        this.clearSurface();
    }

    setCurveType(type) {
        this.curveType = type;
        this.draw2D();
    }

    setAxis(axis) {
        this.axis = axis;
    }

    setAngle(angle) {
        this.angle = parseFloat(angle);
    }

    setSegments(segments) {
        this.segments = parseInt(segments);
    }

    setViewMode(mode) {
        this.viewMode = mode;
        if (this.surfaceMesh || this.wireframeMesh) {
            this.updateViewMode();
        }
    }

    /**
     * Gera perfil 2D usando Bézier ou B-Spline
     */
    generateProfile() {
        if (this.points.length < 2) return [];

        if (this.curveType === 'bezier') {
            const bezier = new BezierCurve(document.createElement('canvas'));
            bezier.points = this.points.map(p => ({...p}));
            bezier.weights = this.points.map(() => 1.0);
            return bezier.generateCurve(100);
        } else {
            const spline = new BSpline(document.createElement('canvas'));
            spline.points = this.points.map(p => ({...p}));
            spline.degree = 3;
            spline.step = 0.01;
            return spline.generateCurve();
        }
    }

    /**
     * Converte coordenadas 2D do canvas para 3D
     */
    canvasTo3D(point) {
        // Normalizar para coordenadas centradas
        const x = (point.x - this.canvas2D.width / 2) / 50;
        const y = -(point.y - this.canvas2D.height / 2) / 50;
        return { x, y };
    }

    /**
     * Gera superfície de revolução
     */
    generateSurface() {
        const profile = this.generateProfile();
        if (profile.length < 2) return;

        const profile3D = profile.map(p => this.canvasTo3D(p));
        const angleRad = (this.angle * Math.PI) / 180;
        const angleStep = angleRad / this.segments;

        const vertices = [];
        const faces = [];

        // Gerar vértices
        for (let i = 0; i <= this.segments; i++) {
            const theta = i * angleStep;
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);

            for (const point of profile3D) {
                let vx, vy, vz;

                if (this.axis === 'y') {
                    const r = point.x;
                    vx = r * cosTheta;
                    vy = point.y;
                    vz = r * sinTheta;
                } else if (this.axis === 'x') {
                    const r = point.y;
                    vx = point.x;
                    vy = r * cosTheta;
                    vz = r * sinTheta;
                } else { // z
                    const r = point.x;
                    vx = r * cosTheta;
                    vy = r * sinTheta;
                    vz = point.y;
                }

                vertices.push(vx, vy, vz);
            }
        }

        // Gerar faces
        const profileLength = profile3D.length;
        for (let i = 0; i < this.segments; i++) {
            for (let j = 0; j < profileLength - 1; j++) {
                const a = i * profileLength + j;
                const b = a + profileLength;
                const c = a + 1;
                const d = b + 1;

                faces.push(a, b, c);
                faces.push(b, d, c);
            }
        }

        this.createMesh(vertices, faces);
    }

    createMesh(vertices, faces) {
        this.clearSurface();

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(faces);
        geometry.computeVertexNormals();

        // Mesh sólido
        const material = new THREE.MeshPhongMaterial({
            color: 0x667eea,
            side: THREE.DoubleSide,
            flatShading: false
        });
        this.surfaceMesh = new THREE.Mesh(geometry, material);

        // Mesh wireframe
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true
        });
        this.wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);

        this.updateViewMode();
    }

    updateViewMode() {
        this.scene.remove(this.surfaceMesh);
        this.scene.remove(this.wireframeMesh);

        if (this.viewMode === 'solid' || this.viewMode === 'both') {
            this.scene.add(this.surfaceMesh);
        }
        if (this.viewMode === 'wireframe' || this.viewMode === 'both') {
            this.scene.add(this.wireframeMesh);
        }
    }

    clearSurface() {
        if (this.surfaceMesh) {
            this.scene.remove(this.surfaceMesh);
            this.surfaceMesh.geometry.dispose();
            this.surfaceMesh.material.dispose();
            this.surfaceMesh = null;
        }
        if (this.wireframeMesh) {
            this.scene.remove(this.wireframeMesh);
            this.wireframeMesh.geometry.dispose();
            this.wireframeMesh.material.dispose();
            this.wireframeMesh = null;
        }
    }

    draw2D() {
        this.ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);

        // Desenhar eixo de revolução
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas2D.width / 2, 0);
        this.ctx.lineTo(this.canvas2D.width / 2, this.canvas2D.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

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

        // Desenhar perfil
        const profile = this.generateProfile();
        if (profile.length > 0) {
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(profile[0].x, profile[0].y);
            for (let i = 1; i < profile.length; i++) {
                this.ctx.lineTo(profile[i].x, profile[i].y);
            }
            this.ctx.stroke();
        }

        // Desenhar pontos de controle
        this.points.forEach((point, i) => {
            this.ctx.fillStyle = '#764ba2';
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(`P${i}`, point.x + 10, point.y - 10);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    exportOBJ() {
        if (!this.surfaceMesh) return '';

        const geometry = this.surfaceMesh.geometry;
        const position = geometry.attributes.position;
        const index = geometry.index;

        let obj = '# Generated by Revolution Surface\n';
        obj += '# Vertices\n';

        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const y = position.getY(i);
            const z = position.getZ(i);
            obj += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
        }

        obj += '\n# Faces\n';
        for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i) + 1;
            const b = index.getX(i + 1) + 1;
            const c = index.getX(i + 2) + 1;
            obj += `f ${a} ${b} ${c}\n`;
        }

        return obj;
    }
}