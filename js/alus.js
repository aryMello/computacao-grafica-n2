/**
 * Módulo de Voo do Alus (CORRIGIDO)
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
        
        // Aguardar o DOM estar pronto antes de inicializar 3D
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setup3D(), 200);
            });
        } else {
            setTimeout(() => this.setup3D(), 200);
        }
    }

    setup3D() {
        // Garantir que o container tem dimensões
        const width = this.container3D.clientWidth || 900;
        const height = this.container3D.clientHeight || 600;
        
        console.log('Dimensões do container Alus:', {
            clientWidth: this.container3D.clientWidth,
            clientHeight: this.container3D.clientHeight,
            width: width,
            height: height
        });
        
        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Cor de céu
        
        // Névoa para efeito de profundidade
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
        
        // Câmera
        const aspect = width / height;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
        this.camera.position.set(30, 30, 50);
        this.camera.lookAt(0, 10, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.container3D.appendChild(this.renderer.domElement);
        
        console.log('Renderer Alus criado:', {
            width: this.renderer.domElement.width,
            height: this.renderer.domElement.height
        });
        
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
        
        // Redimensionar após um pequeno delay
        setTimeout(() => {
            this.handleResize();
        }, 100);
    }
    
    handleResize() {
        const width = this.container3D.clientWidth || 900;
        const height = this.container3D.clientHeight || 600;
        
        console.log('Redimensionando Alus para:', width, 'x', height);
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    createBird() {
        const birdGroup = new THREE.Group();
        
        // Corpo principal - mais arredondado e fofinho
        const bodyGeometry = new THREE.SphereGeometry(0.6, 20, 20);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffa500,
            shininess: 50
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.scale.set(1.2, 1, 1.5); // Corpo mais gordinho
        birdGroup.add(body);
        
        // Cabeça maior e mais fofinha
        const headGeometry = new THREE.SphereGeometry(0.4, 20, 20);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.3, 0.7);
        head.scale.set(1, 1, 1.1);
        birdGroup.add(head);
        
        // Bico mais visível
        const beakGeometry = new THREE.ConeGeometry(0.12, 0.4, 8);
        const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xff6347 });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.3, 1.0);
        birdGroup.add(beak);
        
        // Asas maiores e mais expressivas
        const wingGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xff8c00,
            shininess: 40
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.scale.set(2.5, 0.25, 1);
        leftWing.position.set(-0.9, 0.1, 0);
        birdGroup.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.scale.set(2.5, 0.25, 1);
        rightWing.position.set(0.9, 0.1, 0);
        birdGroup.add(rightWing);
        
        // Olhos maiores e mais expressivos
        const eyeGeometry = new THREE.SphereGeometry(0.08, 12, 12);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 0.45, 0.85);
        birdGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 0.45, 0.85);
        birdGroup.add(rightEye);
        
        // Brilho nos olhos para parecer mais vivo
        const pupilGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.14, 0.47, 0.91);
        birdGroup.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.16, 0.47, 0.91);
        birdGroup.add(rightPupil);
        
        // Cauda fofinha
        const tailGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
        const tail = new THREE.Mesh(tailGeometry, wingMaterial);
        tail.rotation.x = -Math.PI / 2;
        tail.position.set(0, 0, -0.9);
        birdGroup.add(tail);
        
        // Escalar tudo para ser mais visível
        birdGroup.scale.set(1.5, 1.5, 1.5);
        
        this.alusBird = birdGroup;
        this.scene.add(this.alusBird);
        
        // Armazenar asas para animação
        this.leftWing = leftWing;
        this.rightWing = rightWing;
        
        console.log('Pássaro Alus criado (versão fofinha 🐦)');
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
     * Usa a razão áurea nos incrementos angulares e raios baseados em Fibonacci
     */
    generateTrajectory() {
        const PHI = 1.618033988749; // Razão áurea (φ)
        const GOLDEN_ANGLE = 2 * Math.PI / (PHI * PHI); // Ângulo áureo ≈ 137.5°
        const points = [];
        
        const totalCycles = this.cycles;
        const directionMultiplier = this.direction === 'left' ? 1 : -1;
        
        // Dividir em fase de subida e descida
        const climbCycles = Math.floor(totalCycles / 2);
        const descentCycles = totalCycles - climbCycles;
        
        // Gerar números de Fibonacci para os raios
        const fibonacci = [0, 1];
        for (let i = 2; i <= totalCycles; i++) {
            fibonacci.push(fibonacci[i-1] + fibonacci[i-2]);
        }
        
        // Normalizar raios usando escala áurea
        const maxFib = fibonacci[totalCycles];
        // Escala baseada na razão áurea para crescimento natural
        const normalizedFib = fibonacci.map(f => 
            Math.sqrt(f / maxFib) * 25 * PHI // Raiz quadrada para espiral mais suave
        );
        
        let altitude = 0;
        let cumulativeAngle = 0; // Ângulo acumulado
        
        console.log('Gerando trajetória de Fibonacci:', {
            cycles: totalCycles,
            climbCycles: climbCycles,
            descentCycles: descentCycles,
            goldenAngle: (GOLDEN_ANGLE * 180 / Math.PI).toFixed(2) + '°',
            direction: this.direction
        });
        
        // Fase de subida
        for (let i = 0; i < climbCycles; i++) {
            // Raio cresce seguindo Fibonacci
            const radius = normalizedFib[i];
            
            // Incremento angular baseado na razão áurea
            cumulativeAngle += GOLDEN_ANGLE * directionMultiplier;
            
            const x = radius * Math.cos(cumulativeAngle);
            const z = radius * Math.sin(cumulativeAngle);
            
            // Subida constante
            altitude += this.climbRate;
            
            points.push(new THREE.Vector3(x, altitude, z));
        }
        
        const maxAltitude = altitude;
        console.log('Altitude máxima:', maxAltitude.toFixed(2));
        
        // Fase de descida
        for (let i = climbCycles; i < totalCycles; i++) {
            // Raio continua crescendo (Alus se afasta do centro ao descer)
            const radius = normalizedFib[i];
            
            // Incremento angular continua com razão áurea
            cumulativeAngle += GOLDEN_ANGLE * directionMultiplier;
            
            const x = radius * Math.cos(cumulativeAngle);
            const z = radius * Math.sin(cumulativeAngle);
            
            // Descida constante
            altitude -= this.descentRate;
            altitude = Math.max(0, altitude); // Não passar do chão
            
            points.push(new THREE.Vector3(x, altitude, z));
        }
        
        console.log('Pontos de controle gerados:', points.length);
        console.log('Posição final:', {
            x: points[points.length-1].x.toFixed(2),
            y: points[points.length-1].y.toFixed(2),
            z: points[points.length-1].z.toFixed(2)
        });
        
        return points;
    }

    /**
     * Cria curva suave através dos pontos usando Catmull-Rom
     * Garante continuidade C² (segunda derivada contínua)
     */
    createSmoothCurve(points) {
        if (points.length < 4) {
            console.warn('Poucos pontos para curva suave, retornando pontos originais');
            return points;
        }
        
        // Catmull-Rom com tensão baixa para suavidade máxima
        const curve = new THREE.CatmullRomCurve3(points);
        curve.curveType = 'catmullrom';
        curve.tension = 0.3; // Menor tensão = mais suave
        curve.closed = false; // Curva aberta (início ≠ fim)
        
        // Gerar muitos pontos interpolados para movimento suave
        // Usar mais pontos por segmento para melhor aproximação C²
        const pointsPerSegment = 50;
        const totalInterpolatedPoints = points.length * pointsPerSegment;
        const smoothPoints = curve.getPoints(totalInterpolatedPoints);
        
        console.log('Curva suave criada:', {
            pontosControle: points.length,
            pontosInterpolados: smoothPoints.length,
            tensao: curve.tension,
            tipo: curve.curveType
        });
        
        return smoothPoints;
    }

    startFlight() {
        console.log('Iniciando voo do Alus...');
        
        // Gerar trajetória
        const controlPoints = this.generateTrajectory();
        this.trajectoryPoints = this.createSmoothCurve(controlPoints);
        
        console.log('Trajetória gerada:', this.trajectoryPoints.length, 'pontos');
        
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
        console.log('Voo pausado');
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
        console.log('Voo resetado');
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
        
        console.log('Trajetória desenhada na cena');
    }

    updateBirdPosition() {
        if (!this.isFlying || this.trajectoryPoints.length === 0) return;
        
        // Avançar posição com velocidade ajustada
        this.currentPosition += this.speed * 0.3; // Ajustado para movimento mais suave
        
        if (this.currentPosition >= this.trajectoryPoints.length - 1) {
            this.currentPosition = this.trajectoryPoints.length - 1;
            this.isFlying = false;
            console.log('Voo finalizado - Alus pousou! 🐦');
            return;
        }
        
        // Interpolar posição com suavidade
        const index = Math.floor(this.currentPosition);
        const t = this.currentPosition - index;
        const p1 = this.trajectoryPoints[index];
        const p2 = this.trajectoryPoints[Math.min(index + 1, this.trajectoryPoints.length - 1)];
        
        // Atualizar posição do pássaro
        this.alusBird.position.lerpVectors(p1, p2, t);
        
        // Orientar pássaro na direção do movimento
        if (index + 1 < this.trajectoryPoints.length) {
            const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
            
            // Rotação horizontal (yaw) - direção de voo
            const angle = Math.atan2(direction.x, direction.z);
            this.alusBird.rotation.y = angle;
            
            // Inclinação (pitch) - baseada na subida/descida
            const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
            const pitch = Math.atan2(direction.y, horizontalDistance);
            this.alusBird.rotation.x = -pitch * 0.5; // Suavizar a inclinação
            
            // Rolagem (roll) - inclinar nas curvas
            if (index + 2 < this.trajectoryPoints.length) {
                const p3 = this.trajectoryPoints[index + 2];
                const nextDirection = new THREE.Vector3().subVectors(p3, p2).normalize();
                const crossProduct = new THREE.Vector3().crossVectors(direction, nextDirection);
                const roll = crossProduct.y * 0.3; // Intensidade da rolagem
                this.alusBird.rotation.z = roll;
            }
        }
        
        // Animar asas - batida mais realista
        const time = Date.now() * 0.012; // Frequência de batida
        const wingBeatAmplitude = 0.5; // Amplitude maior para movimento mais visível
        
        // Movimento de batida: subida e descida com fase
        const wingAngle = Math.sin(time) * wingBeatAmplitude;
        
        // Asas se movem de forma oposta para dar efeito de batida
        this.leftWing.rotation.z = wingAngle;
        this.rightWing.rotation.z = -wingAngle;
        
        // Movimento para frente/trás das asas durante a batida
        const wingForwardMotion = Math.cos(time) * 0.1;
        this.leftWing.position.z = wingForwardMotion;
        this.rightWing.position.z = wingForwardMotion;
        
        // Câmera segue o pássaro suavemente com offset dinâmico
        const speed = new THREE.Vector3().subVectors(p2, p1).length();
        const cameraDistance = 15 + speed * 5; // Câmera se afasta em alta velocidade
        
        const targetCameraPos = new THREE.Vector3(
            this.alusBird.position.x + cameraDistance * 0.8,
            this.alusBird.position.y + 8,
            this.alusBird.position.z + cameraDistance * 0.8
        );
        
        // Suavização da câmera (lerp mais lento = mais suave)
        this.camera.position.lerp(targetCameraPos, 0.03);
        
        // Câmera olha um pouco à frente do pássaro
        const lookAheadPoint = new THREE.Vector3(
            this.alusBird.position.x,
            this.alusBird.position.y,
            this.alusBird.position.z
        );
        this.camera.lookAt(lookAheadPoint);
    }

    getStatus() {
        if (this.trajectoryPoints.length === 0) {
            return {
                altitude: '0.00',
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