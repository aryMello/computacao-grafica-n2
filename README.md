# Projeto de Computação Gráfica - Curvas e Superfícies

Projeto completo de computação gráfica implementando curvas paramétricas, superfícies de revolução e animação 3D.

## Visão Geral

Este projeto implementa quatro módulos principais de computação gráfica:

1. **Curvas de Bézier** - Geração e manipulação de curvas de Bézier com pesos
2. **B-Splines** - Interpolação B-Spline cúbica uniforme
3. **Superfície de Revolução** - Geração de superfícies 3D a partir de perfis 2D
4. **Voo do Alus** - Simulação de trajetória espiralada baseada em Fibonacci

## Funcionalidades

### 1. Curvas de Bézier

- Criação de curvas de grau variável
- Edição interativa de pontos de controle
- Ajuste de pesos individuais (suporte a curvas racionais)

### 2. B-Splines

- Interpolação B-Spline cúbica uniforme
- Controle de grau da curva (2-5)
- Ajuste de passo de interpolação
- Importação de pontos de Bézier

### 3. Superfície de Revolução

- Perfil 2D usando Bézier ou B-Spline
- Seleção de eixo de revolução (X, Y, Z)
- Ângulo de rotação configurável (30°-360°)
- Subdivisões angulares ajustáveis
- Modos de visualização: sólido, wireframe, ambos
- Visualização 3D interativa

### 4. Voo do Alus

- Trajetória espiralada baseada em Fibonacci
- 50-100 ciclos configuráveis
- Direção do giro (esquerda/direita)
- Taxas de subida e descida independentes
- Animação fluida com velocidade constante
- Visualização 3D com câmera que segue o pássaro
- Modelo 3D de pássaro completo

## Algoritmos Implementados

### Algoritmo de De Casteljau (Bézier)

Implementação recursiva para cálculo de pontos em curvas de Bézier:

```javascript
deCasteljau(t) {
    // Cópia dos pontos ponderados
    let tempPoints = this.points.map((p, i) => ({
        x: p.x * this.weights[i],
        y: p.y * this.weights[i],
        w: this.weights[i]
    }));

    // Interpolação recursiva
    while (tempPoints.length > 1) {
        const newPoints = [];
        for (let i = 0; i < tempPoints.length - 1; i++) {
            newPoints.push({
                x: (1 - t) * tempPoints[i].x + t * tempPoints[i + 1].x,
                y: (1 - t) * tempPoints[i].y + t * tempPoints[i + 1].y,
                w: (1 - t) * tempPoints[i].w + t * tempPoints[i + 1].w
            });
        }
        tempPoints = newPoints;
    }

    // Normalização pelo peso final
    return { x: final.x / final.w, y: final.y / final.w };
}
```

### Algoritmo Cox-de Boor (B-Spline)

Implementação das funções base para B-Splines:

```javascript
basisFunction(i, p, u, knots) {
    if (p === 0) {
        return (knots[i] <= u && u < knots[i + 1]) ? 1.0 : 0.0;
    }

    let left = 0.0, right = 0.0;

    // Termo esquerdo
    const denomLeft = knots[i + p] - knots[i];
    if (Math.abs(denomLeft) > 1e-10) {
        left = ((u - knots[i]) / denomLeft) * 
               this.basisFunction(i, p - 1, u, knots);
    }

    // Termo direito
    const denomRight = knots[i + p + 1] - knots[i + 1];
    if (Math.abs(denomRight) > 1e-10) {
        right = ((knots[i + p + 1] - u) / denomRight) * 
                this.basisFunction(i + 1, p - 1, u, knots);
    }

    return left + right;
}
```

### Geração de Superfície de Revolução

Rotação de perfil 2D em torno de um eixo:

```javascript
// Para cada ângulo de rotação
for (let i = 0; i <= segments; i++) {
    const theta = i * angleStep;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    // Para cada ponto do perfil
    for (const point of profile3D) {
        // Rotação em torno do eixo Y
        const r = point.x;
        vx = r * cosTheta;
        vy = point.y;
        vz = r * sinTheta;
        
        vertices.push(vx, vy, vz);
    }
}
```

### Trajetória de Fibonacci (Alus)

Geração de espiral baseada na razão áurea:

```javascript
generateTrajectory() {
    const PHI = 1.618033988749; // Razão áurea
    
    // Gerar sequência de Fibonacci
    const fibonacci = [1, 1];
    for (let i = 2; i < totalCycles; i++) {
        fibonacci.push(fibonacci[i-1] + fibonacci[i-2]);
    }
    
    // Normalizar e gerar pontos
    for (let i = 0; i < cycles; i++) {
        const radius = normalizedFib[i];
        const angle = (i * PHI * 2 * Math.PI) * direction;
        
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        altitude += (isClimbing ? climbRate : -descentRate);
        
        points.push(new THREE.Vector3(x, altitude, z));
    }
    
    return points;
}
```

## Como Usar

### Instalação

1. Clone o repositório ou baixe os arquivos
2. Não é necessário instalação - funciona diretamente no navegador
3. Abra `index.html` em um navegador moderno

## Tecnologias

- **HTML5**: Estrutura e Canvas 2D
- **CSS3**: Estilização e animações
- **JavaScript (ES6+)**: Lógica e algoritmos
- **Three.js (r128)**: Renderização 3D
- **Módulos ES6**: Organização do código

## Licença

Projeto acadêmico - Livre para uso educacional

## Autor

@aryMello