# Análise DeviceOrientation → Three.js

## 📱 Como DeviceOrientation Funciona

### Sistema de Coordenadas do Dispositivo
```
     y (topo)
     ↑
     |
     |_____ x (direita)
    /
   /
  z (saindo da tela)
```

### Os Três Ângulos

**Alpha (α)** - Rotação em torno do eixo Z
- Range: 0° a 360°
- 0° = topo do dispositivo aponta para norte
- Aumenta no sentido anti-horário (visto de cima)
- É a bússola digital

**Beta (β)** - Rotação em torno do eixo X
- Range: -180° a 180°
- 0° = dispositivo plano (paralelo ao chão)
- Positivo = inclinar topo para frente
- Negativo = inclinar topo para trás

**Gamma (γ)** - Rotação em torno do eixo Y
- Range: -90° a 90°
- 0° = dispositivo plano
- Positivo = inclinar para direita
- Negativo = inclinar para esquerda

### ⚠️ Ordem de Rotação: Z → X' → Y'' (Intrinsic/Tait-Bryan)

As rotações são aplicadas sequencialmente:
1. Primeiro: rotação Alpha em torno de Z
2. Segundo: rotação Beta em torno do **novo** eixo X' (já rotacionado)
3. Terceiro: rotação Gamma em torno do **novo** eixo Y'' (já rotacionado 2x)

**Isso é crucial:** cada rotação muda o sistema de coordenadas para a próxima!

## 🎮 Three.js Rotation System

Three.js usa **Euler angles** com ordem configurável:
- Padrão: 'XYZ' (extrinsic)
- `rotation.set(x, y, z)` aplica na ordem padrão
- Pode especificar ordem: `rotation.order = 'YXZ'`

### 🚨 O PROBLEMA no seu código

```javascript
// orientation-mapper.js
'direct-swapped': (alpha, beta, gamma) => ({
    x: gamma,   // Você mapeia gamma → X
    y: beta,    // beta → Y
    z: alpha    // alpha → Z
})

// scene-3d.js
cube.rotation.set(rotation.x, rotation.y, rotation.z);
// ↑ Usa ordem padrão 'XYZ' do Three.js
```

**Problema:** Você está pegando ângulos de um sistema ZX'Y'' e aplicando em ordem XYZ!

## ✅ Solução Correta

### Opção 1: Usar ordem YXZ (recomendado)

```javascript
// Three.js DeviceOrientationControls usa esta fórmula:
euler.set(beta, alpha, -gamma, 'YXZ')
```

Traduzindo para seu código:
```javascript
// scene-3d.js - ADICIONAR
AppState.cube.rotation.order = 'YXZ';

// orientation-mapper.js
'correct-yxz': (alpha, beta, gamma) => ({
    x: beta,     // Rotação X (frente/trás)
    y: alpha,    // Rotação Y (bússola)
    z: -gamma    // Rotação Z (esquerda/direita) - NEGATIVO!
})
```

### Opção 2: Converter para Quaternion (mais preciso)

```javascript
const euler = new THREE.Euler(beta, alpha, -gamma, 'YXZ');
const quaternion = new THREE.Quaternion().setFromEuler(euler);
cube.quaternion.copy(quaternion);
```

### Por que -gamma?

O eixo Y do DeviceOrientation aponta para cima, mas Three.js usa Y para cima também.
A convenção de rotação é invertida, então precisa do negativo.

## 🧪 Por que seu código "meio funciona"?

Para pequenas rotações, a ordem importa menos. Mas para rotações grandes ou combinadas,
a ordem errada causa:
- Gimbal lock em 90°
- Rotações estranhas quando combina múltiplos eixos
- Comportamento inconsistente

## 📊 Comparação

| Método | Ordem | Alpha | Beta | Gamma | Correto? |
|--------|-------|-------|------|-------|----------|
| DeviceOrientation | ZX'Y'' | Z | X' | Y'' | ✓ |
| Three.js default | XYZ | Y | X | Z | ✗ |
| DeviceOrientationControls | YXZ | Y | X | Z | ✓ |
| Seu código atual | XYZ | Z | Y | X | ✗ |

## 🎯 Recomendação

Use a implementação padrão do Three.js:
```javascript
cube.rotation.order = 'YXZ';
cube.rotation.set(beta, alpha, -gamma);
```

Isso elimina mapeamentos customizados e usa a matemática testada da biblioteca.
