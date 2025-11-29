/**
 * Módulo de Voo do Alus
 * Simula trajetória espiralada baseada em Fibonacci
 */

export class AlusFlight {
    constructor(container3D) {
        this.container3D = container3D;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.alusBird = null;
        this.trajectoryLine = null;
        
        this.isFlying = false;
        this.currentPosition = 0;
        this.trajectoryPoints = [];
        
        // Parâmetros configuráveis
        this.cycles = 50;
        this.direction = 'left';
        this.speed = 1.0;
        this.climbRate = 0.5;
        this.descentRate = 0.5;
        
        this.setup3D();
    }

    setup3D() {
        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Cor de céu
        
        // Névoa para efeito de profundidade
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
        
        // Câmera
        const aspect = this.container3D.clientWidth / this.container3D.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
        this.camera.position.set(30, 30, 50);
        this.camera.lookAt(0, 10, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container3D.clientWidth, this.container3D.clientHeight);
        this.container3D.appendChild(this.renderer.domElement);
        
        // Iluminação
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(0xffd700, 0.8);
        sunLight.position.set(50, 100, 50);
        this.scene.add(sunLight);
        
        // Chão
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x90ee90,
            side: THREE.DoubleSide 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);
        
        // Eixos de referência
        const axesHelper = new THREE.AxesHelper(20);
        this.scene.add(axesHelper);
        
        // Criar Alus (pássaro)
        this.createBird();
        
        // Controles de mouse
        this.setupMouseControls();
        
        this.animate();
    }

    createBird() {
        const birdGroup = new THREE.Group();
        
        // Corpo
        const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xffa500 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1, 0.8, 1.3);
        birdGroup.add(body);
        
        // Cabeça
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.2, 0.5);
        birdGroup.add(head);
        
        // Bico
        const beakGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xff6347 });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.2, 0.8);
        birdGroup.add(beak);
        
        // Asas
        const wingGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xff8c00 });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.scale.set(2, 0.2, 0.8);
        leftWing.position.set(-0.7, 0, 0);
        birdGroup.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.scale.set(2, 0.2, 0.8);
        rightWing.position.set(0.7, 0, 0);
        birdGroup.add(rightWing);
        
        // Olhos
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 0.3, 0.6);
        birdGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 0.3, 0.6);
        birdGroup.add(rightEye);
        
        this.alusBird = birdGroup;
        this.scene.add(this.alusBird);
        
        // Armazenar asas para animação
        this.leftWing = leftWing;
        this.rightWing = rightWing;
    }

    setupMouseControls() {
        let isRotating = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.renderer.domElement.addEventListener('mousedown', () => {
            isRotating = true;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isRotating) {
                const deltaX = e.offsetX - previousMousePosition.x;
                const deltaY = e.offsetY - previousMousePosition.y;
                
                const radius = this.camera.position.length();
                const theta = Math.atan2(this.camera.position.z, this.camera.position.x);
                const phi = Math.acos(this.camera.position.y / radius);
                
                const newTheta = theta - deltaX * 0.01;
                const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.01));
                
                this.camera.position.x = radius * Math.sin(newPhi) * Math.cos(newTheta);
                this.camera.position.y = radius * Math.cos(newPhi);
                this.camera.position.z = radius * Math.sin(newPhi) * Math.sin(newTheta);
                this.camera.lookAt(0, 10, 0);
            }
            
            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isRotating = false;
        });
        
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const distance = this.camera.position.length();
            const newDistance = Math.max(10, Math.min(150, distance + e.deltaY * 0.1));
            this.camera.position.multiplyScalar(newDistance / distance);
        });
    }

    /**
     * Gera trajetória em espiral de Fibonacci
     */
    generateTrajectory() {
        const PHI = 1.618033988749; // Razão áurea
        const points = [];
        
        const totalCycles = this.cycles;
        const directionMultiplier = this.direction === 'left' ? 1 : -1;
        
        // Dividir em fase de subida e descida
        const climbCycles = Math.floor(totalCycles / 2);
        const descentCycles = totalCycles - climbCycles;
        
        // Gerar números de Fibonacci
        const fibonacci = [1, 1];
        for (let i = 2; i < totalCycles; i++) {
            fibonacci.push(fibonacci[i-1] + fibonacci[i-2]);
        }
        
        // Normalizar para manter raios razoáveis
        const maxFib = fibonacci[totalCycles - 1];
        const normalizedFib = fibonacci.map(f => (f / maxFib) * 20);
        
        let altitude = 0;
        const maxAltitude = climbCycles * this.climbRate * 2;
        
        // Fase de subida
        for (let i = 0; i < climbCycles; i++) {
            const radius = normalizedFib[i];
            const angle = (i * PHI * 2 * Math.PI) * directionMultiplier;
            
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            altitude += this.climbRate;
            
            points.push(new THREE.Vector3(x, altitude, z));
        }
        
        // Fase de descida
        for (let i = climbCycles; i < totalCycles; i++) {
            const radius = normalizedFib[i];
            const angle = (i * PHI * 2 * Math.PI) * directionMultiplier;
            
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            altitude -= this.descentRate;
            altitude = Math.max(0, altitude);
            
            points.push(new THREE.Vector3(x, altitude, z));
        }
        
        return points;
    }

    /**
     * Cria curva suave através dos pontos usando Catmull-Rom
     */
    createSmoothCurve(points) {
        const curve = new THREE.CatmullRomCurve3(points);
        curve.curveType = 'catmullrom';
        curve.tension = 0.5;
        
        // Gerar pontos interpolados
        const smoothPoints = curve.getPoints(points.length * 20);
        return smoothPoints;
    }

    startFlight() {
        // Gerar trajetória
        const controlPoints = this.generateTrajectory();
        this.trajectoryPoints = this.createSmoothCurve(controlPoints);
        
        // Desenhar linha de trajetória
        this.drawTrajectory();
        
        // Posicionar Alus no início
        this.currentPosition = 0;
        this.isFlying = true;
        
        // Resetar posição da câmera para acompanhar
        this.camera.position.set(30, 30, 50);
        this.camera.lookAt(0, 10, 0);
    }

    stopFlight() {
        this.isFlying = false;
    }

    resetFlight() {
        this.isFlying = false;
        this.currentPosition = 0;
        
        if (this.alusBird) {
            this.alusBird.position.set(0, 0, 0);
            this.alusBird.rotation.set(0, 0, 0);
        }
        
        if (this.trajectoryLine) {
            this.scene.remove(this.trajectoryLine);
            this.trajectoryLine = null;
        }
        
        this.trajectoryPoints = [];
    }

    drawTrajectory() {
        // Remover linha anterior
        if (this.trajectoryLine) {
            this.scene.remove(this.trajectoryLine);
        }
        
        // Criar nova linha com gradiente de cores
        const geometry = new THREE.BufferGeometry().setFromPoints(this.trajectoryPoints);
        
        // Criar cores baseadas na altitude
        const colors = [];
        for (let i = 0; i < this.trajectoryPoints.length; i++) {
            const t = i / this.trajectoryPoints.length;
            const altitude = this.trajectoryPoints[i].y;
            const normalizedAlt = altitude / 30;
            
            // Gradiente de verde (baixo) para azul (alto)
            const r = 0.2 + normalizedAlt * 0.3;
            const g = 0.5 + normalizedAlt * 0.3;
            const b = 0.8;
            
            colors.push(r, g, b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 2
        });
        
        this.trajectoryLine = new THREE.Line(geometry, material);
        this.scene.add(this.trajectoryLine);
    }

    updateBirdPosition() {
        if (!this.isFlying || this.trajectoryPoints.length === 0) return;
        
        // Avançar posição
        this.currentPosition += this.speed * 0.5;
        
        if (this.currentPosition >= this.trajectoryPoints.length - 1) {
            this.currentPosition = this.trajectoryPoints.length - 1;
            this.isFlying = false;
            return;
        }
        
        // Interpolar posição
        const index = Math.floor(this.currentPosition);
        const t = this.currentPosition - index;
        const p1 = this.trajectoryPoints[index];
        const p2 = this.trajectoryPoints[Math.min(index + 1, this.trajectoryPoints.length - 1)];
        
        this.alusBird.position.lerpVectors(p1, p2, t);
        
        // Orientar pássaro na direção do movimento
        if (index + 1 < this.trajectoryPoints.length) {
            const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
            const angle = Math.atan2(direction.x, direction.z);
            this.alusBird.rotation.y = angle;
            
            // Inclinar baseado na variação de altitude
            const pitch = Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z));
            this.alusBird.rotation.x = -pitch;
        }
        
        // Animar asas
        const wingAngle = Math.sin(Date.now() * 0.01) * 0.3;
        this.leftWing.rotation.z = wingAngle;
        this.rightWing.rotation.z = -wingAngle;
        
        // Câmera segue o pássaro suavemente
        const targetCameraPos = new THREE.Vector3(
            this.alusBird.position.x + 15,
            this.alusBird.position.y + 10,
            this.alusBird.position.z + 20
        );
        this.camera.position.lerp(targetCameraPos, 0.02);
        this.camera.lookAt(this.alusBird.position);
    }

    getStatus() {
        if (this.trajectoryPoints.length === 0) {
            return {
                altitude: 0,
                position: 0,
                state: 'Parado'
            };
        }
        
        const progress = (this.currentPosition / (this.trajectoryPoints.length - 1)) * 100;
        const altitude = this.alusBird.position.y;
        const state = this.isFlying ? 'Voando' : (progress >= 99 ? 'Pousado' : 'Parado');
        
        return {
            altitude: altitude.toFixed(2),
            position: progress.toFixed(1),
            state: state
        };
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isFlying) {
            this.updateBirdPosition();
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    setCycles(cycles) {
        this.cycles = parseInt(cycles);
    }

    setDirection(direction) {
        this.direction = direction;
    }

    setSpeed(speed) {
        this.speed = parseFloat(speed);
    }

    setClimbRate(rate) {
        this.climbRate = parseFloat(rate);
    }

    setDescentRate(rate) {
        this.descentRate = parseFloat(rate);
    }
}