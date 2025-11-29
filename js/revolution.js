/**
 * Módulo de Superfície de Revolução (CORRIGIDO)
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
        
        // Criar instâncias das curvas para usar seus métodos
        this.bezierHelper = new BezierCurve(document.createElement('canvas'));
        this.splineHelper = new BSpline(document.createElement('canvas'));
        
        this.setupCanvas2D();
        
        // Aguardar o DOM estar pronto antes de inicializar 3D
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setup3D(), 200);
            });
        } else {
            setTimeout(() => this.setup3D(), 200);
        }
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
        
        // Garantir que o container tem dimensões
        const width = this.container3D.clientWidth || 600;
        const height = this.container3D.clientHeight || 500;
        
        console.log('Dimensões do container 3D:', {
            clientWidth: this.container3D.clientWidth,
            clientHeight: this.container3D.clientHeight,
            offsetWidth: this.container3D.offsetWidth,
            offsetHeight: this.container3D.offsetHeight,
            width: width,
            height: height
        });
        
        // Câmera
        const aspect = width / height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(5, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.container3D.appendChild(this.renderer.domElement);
        
        console.log('Renderer criado:', {
            width: this.renderer.domElement.width,
            height: this.renderer.domElement.height,
            pixelRatio: this.renderer.getPixelRatio()
        });
        
        // Iluminação
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
        
        // Adicionar uma segunda luz para melhor iluminação
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-10, -10, -10);
        this.scene.add(directionalLight2);
        
        // Eixos
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        // Grid
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);
        
        // Adicionar cubo de teste para verificar se o render funciona
        const testGeometry = new THREE.BoxGeometry(2, 2, 2);
        const testMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.testCube = new THREE.Mesh(testGeometry, testMaterial);
        this.testCube.position.set(0, 1, 0);
        // Descomente a linha abaixo para ver o cubo de teste
        // this.scene.add(this.testCube);
        
        console.log('Objetos iniciais na cena:', this.scene.children.length);
        
        // Controles de mouse
        this.setupMouseControls();
        
        // Mesh da superfície
        this.surfaceMesh = null;
        this.wireframeMesh = null;
        
        this.animate();
        
        // Redimensionar após um pequeno delay para garantir que o CSS foi aplicado
        setTimeout(() => {
            this.handleResize();
        }, 100);
    }
    
    handleResize() {
        const width = this.container3D.clientWidth || 600;
        const height = this.container3D.clientHeight || 500;
        
        console.log('Redimensionando para:', width, 'x', height);
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
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
                
                // Rotação orbital ao redor do centro
                const rotationSpeed = 0.005;
                const radius = this.camera.position.length();
                const theta = Math.atan2(this.camera.position.z, this.camera.position.x);
                const phi = Math.acos(this.camera.position.y / radius);
                
                const newTheta = theta - deltaX * rotationSpeed;
                const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY * rotationSpeed));
                
                this.camera.position.x = radius * Math.sin(newPhi) * Math.cos(newTheta);
                this.camera.position.y = radius * Math.cos(newPhi);
                this.camera.position.z = radius * Math.sin(newPhi) * Math.sin(newTheta);
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
     * Gera perfil 2D usando Bézier ou B-Spline (CORRIGIDO)
     */
    generateProfile() {
        if (this.points.length < 2) return [];

        if (this.curveType === 'bezier') {
            // Usar o helper de Bézier
            this.bezierHelper.points = this.points.map(p => ({...p}));
            this.bezierHelper.weights = this.points.map(() => 1.0);
            return this.bezierHelper.generateCurve(100);
        } else {
            // Usar o helper de B-Spline
            this.splineHelper.points = this.points.map(p => ({...p}));
            this.splineHelper.degree = 3;
            this.splineHelper.step = 0.01;
            
            // Verificar se temos pontos suficientes para B-Spline
            if (this.points.length < this.splineHelper.degree + 2) {
                console.warn('Pontos insuficientes para B-Spline, usando Bézier');
                this.bezierHelper.points = this.points.map(p => ({...p}));
                this.bezierHelper.weights = this.points.map(() => 1.0);
                return this.bezierHelper.generateCurve(100);
            }
            
            return this.splineHelper.generateCurve();
        }
    }

    /**
     * Converte coordenadas 2D do canvas para 3D
     */
    canvasTo3D(point) {
        // Normalizar para coordenadas centradas com escala maior
        const x = (point.x - this.canvas2D.width / 2) / 30; // Aumentado de 50 para 30
        const y = -(point.y - this.canvas2D.height / 2) / 30;
        return { x, y };
    }

    /**
     * Gera superfície de revolução
     */
    generateSurface() {
        const profile = this.generateProfile();
        
        console.log('Gerando superfície:', {
            profilePoints: profile.length,
            controlPoints: this.points.length,
            curveType: this.curveType,
            axis: this.axis,
            angle: this.angle,
            segments: this.segments
        });
        
        if (profile.length < 2) {
            console.error('Perfil insuficiente');
            alert('Adicione mais pontos de controle para gerar a superfície!');
            return;
        }

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
                    const r = Math.abs(point.x); // Garantir raio positivo
                    vx = r * cosTheta;
                    vy = point.y;
                    vz = r * sinTheta;
                } else if (this.axis === 'x') {
                    const r = Math.abs(point.y);
                    vx = point.x;
                    vy = r * cosTheta;
                    vz = r * sinTheta;
                } else { // z
                    const r = Math.abs(point.x);
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

        console.log('Superfície gerada:', {
            vertices: vertices.length / 3,
            faces: faces.length / 3
        });

        // Debug: verificar bounding box
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        for (let i = 0; i < vertices.length; i += 3) {
            minX = Math.min(minX, vertices[i]);
            maxX = Math.max(maxX, vertices[i]);
            minY = Math.min(minY, vertices[i + 1]);
            maxY = Math.max(maxY, vertices[i + 1]);
            minZ = Math.min(minZ, vertices[i + 2]);
            maxZ = Math.max(maxZ, vertices[i + 2]);
        }
        
        console.log('Bounding Box:', {
            x: [minX.toFixed(2), maxX.toFixed(2)],
            y: [minY.toFixed(2), maxY.toFixed(2)],
            z: [minZ.toFixed(2), maxZ.toFixed(2)]
        });

        this.createMesh(vertices, faces);
    }

    createMesh(vertices, faces) {
        this.clearSurface();

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(faces);
        geometry.computeVertexNormals();

        // Calcular centro da geometria
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        
        console.log('Centro da geometria:', center);
        console.log('Tamanho da bbox:', {
            width: (boundingBox.max.x - boundingBox.min.x).toFixed(2),
            height: (boundingBox.max.y - boundingBox.min.y).toFixed(2),
            depth: (boundingBox.max.z - boundingBox.min.z).toFixed(2)
        });

        // Mesh sólido com cor vibrante
        const material = new THREE.MeshPhongMaterial({
            color: 0x667eea,
            side: THREE.DoubleSide,
            flatShading: false,
            shininess: 30,
            emissive: 0x222244, // Adicionar emissão para visibilidade
            emissiveIntensity: 0.2
        });
        this.surfaceMesh = new THREE.Mesh(geometry, material);

        // Mesh wireframe mais visível
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: false,
            opacity: 1.0
        });
        this.wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);

        this.updateViewMode();
        
        console.log('Mesh criado e adicionado à cena');
        console.log('Objetos na cena:', this.scene.children.length);
        console.log('Posição da câmera:', this.camera.position);
    }

    updateViewMode() {
        // Remover meshes antigos se existirem
        if (this.surfaceMesh) {
            this.scene.remove(this.surfaceMesh);
        }
        if (this.wireframeMesh) {
            this.scene.remove(this.wireframeMesh);
        }

        // Adicionar baseado no modo
        if (this.viewMode === 'solid' || this.viewMode === 'both') {
            if (this.surfaceMesh) {
                this.scene.add(this.surfaceMesh);
                console.log('Superfície sólida adicionada à cena');
            }
        }
        if (this.viewMode === 'wireframe' || this.viewMode === 'both') {
            if (this.wireframeMesh) {
                this.scene.add(this.wireframeMesh);
                console.log('Wireframe adicionado à cena');
            }
        }
        
        console.log('Modo de visualização:', this.viewMode);
        console.log('Total de objetos na cena após updateViewMode:', this.scene.children.length);
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
            
            this.ctx.fillStyle = '#fafafaff';
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