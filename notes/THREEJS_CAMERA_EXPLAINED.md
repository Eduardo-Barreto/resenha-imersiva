# Three.js Camera: rotation vs lookAt

## 🎥 Conceitos Fundamentais

Uma câmera no Three.js tem duas propriedades principais de orientação:

1. **position** - Onde a câmera está no espaço 3D
2. **rotation** - Para onde a câmera está apontando (orientação)

## 📐 rotation - Orientação Explícita

```javascript
camera.rotation.x = Math.PI / 4;  // Rotaciona 45° em torno do eixo X
camera.rotation.y = Math.PI / 2;  // Rotaciona 90° em torno do eixo Y
camera.rotation.z = 0;            // Sem rotação no eixo Z
```

### Como funciona:
- Define ângulos Euler **explicitamente** (em radianos)
- X: pitch (inclinar para cima/baixo)
- Y: yaw (girar esquerda/direita)
- Z: roll (rotação no próprio eixo)
- É uma orientação **absoluta** no espaço

### Características:
- ✓ Controle preciso dos ângulos
- ✓ Útil para animações e transições
- ✗ Você precisa calcular os ângulos manualmente
- ✗ Sujeito a gimbal lock
- ✗ Não intuitivo para "apontar para algo"

### Exemplo:
```javascript
// Câmera olhando para baixo em 30°
camera.rotation.x = -Math.PI / 6;  // -30° em radianos
```

## 🎯 lookAt() - Orientação por Alvo

```javascript
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);  // Aponta para a origem
```

### Como funciona:
- Você especifica um **ponto alvo** (x, y, z)
- Three.js **calcula automaticamente** os ângulos de rotação necessários
- A câmera "olha para" aquele ponto, como se você virasse a cabeça

### Características:
- ✓ Extremamente intuitivo
- ✓ Perfeito para seguir objetos
- ✓ Evita cálculos manuais de ângulos
- ✓ Funciona com Vector3
- ✗ Sobrescreve rotation atual
- ✗ Menos controle sobre roll (rotação Z)

### Exemplo:
```javascript
const target = new THREE.Vector3(10, 2, -5);
camera.lookAt(target);  // Aponta para o ponto (10, 2, -5)

// Ou direto com coordenadas:
camera.lookAt(cube.position);  // Aponta para um objeto
```

## 🔄 O que acontece quando você chama lookAt()?

Internamente, Three.js faz isso:

```javascript
// Pseudocódigo do que lookAt() faz
lookAt(target) {
    // 1. Calcula direção da câmera até o alvo
    const direction = target - camera.position;

    // 2. Normaliza (vetor unitário)
    direction.normalize();

    // 3. Calcula ângulos necessários usando o "up vector"
    const angles = calculateEulerAngles(direction, camera.up);

    // 4. Atualiza camera.rotation
    camera.rotation.set(angles.x, angles.y, angles.z);
}
```

**Importante:** `lookAt()` SOBRESCREVE `rotation`!

## 🆚 Comparação Lado a Lado

```javascript
// MÉTODO 1: Usando rotation
camera.position.set(0, 5, 10);
camera.rotation.x = -Math.atan2(5, 10);  // Você calcula!
camera.rotation.y = 0;

// MÉTODO 2: Usando lookAt
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);  // Three.js calcula!
// Ambos resultam na mesma orientação
```

## 🧭 O "Up Vector"

Toda câmera tem um vetor "up" que define qual direção é "para cima":

```javascript
camera.up.set(0, 1, 0);  // Padrão: Y é "para cima"
```

O `lookAt()` usa esse vetor para decidir como orientar a câmera:
- Define a direção frontal (para o alvo)
- Mantém o "up" alinhado com camera.up
- Calcula o "right" usando produto vetorial

```
       up (0,1,0)
        ↑
        |
camera  ●----→ direction (para o alvo)
        |
        ↓
      right (perpendicular)
```

## 🎬 Casos de Uso

### Use rotation quando:
1. Você quer controle preciso dos ângulos
2. Está fazendo animações suaves (lerp entre ângulos)
3. Precisa de rotação específica no eixo Z (roll)
4. Está aplicando rotações incrementais

```javascript
// Exemplo: rotação suave
function animate() {
    camera.rotation.y += 0.01;  // Gira continuamente
}
```

### Use lookAt quando:
1. Quer apontar para um objeto/ponto específico
2. Está seguindo um alvo móvel
3. Precisa de orientação inicial simples
4. Não se importa com o roll (rotação Z)

```javascript
// Exemplo: câmera seguindo jogador
function animate() {
    camera.lookAt(player.position);  // Sempre aponta para o jogador
}
```

## ⚠️ Armadilhas Comuns

### 1. lookAt depois de rotation não funciona como esperado
```javascript
camera.rotation.y = Math.PI;
camera.lookAt(0, 0, 0);  // SOBRESCREVE rotation.y!
```

### 2. Usar lookAt em loop sem atualizar position
```javascript
// ❌ ERRADO - não faz nada
function animate() {
    camera.lookAt(target);  // Se position não muda, rotação também não
}

// ✓ CORRETO - atualiza quando necessário
function animate() {
    if (target.hasMoved) {
        camera.lookAt(target.position);
    }
}
```

### 3. Esquecer de setar position antes de lookAt
```javascript
// ❌ ERRADO - lookAt da origem para origem = indefinido
camera.lookAt(0, 0, 0);

// ✓ CORRETO
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);
```

## 🎯 No Seu Código

No seu projeto atual:

```javascript
// scene-3d.js
camera.position.x = -5;
camera.position.y = 2;
camera.position.z = 0;
camera.rotation.y = Math.PI / 2;  // Rotação manual
camera.lookAt(0, 0, 0);           // Depois usa lookAt
```

**O que acontece:**
1. Define posição (-5, 2, 0)
2. Define rotação Y = 90°
3. **lookAt SOBRESCREVE a rotação** para apontar para (0,0,0)

A linha `camera.rotation.y = Math.PI / 2` é **ignorada**!

### Você deveria fazer:

```javascript
// OPÇÃO 1: Só lookAt (recomendado)
camera.position.set(-5, 2, 0);
camera.lookAt(0, 0, 0);

// OPÇÃO 2: Só rotation (se precisa de controle exato)
camera.position.set(-5, 2, 0);
camera.rotation.y = Math.atan2(0, 5);  // Calcula ângulo correto
camera.rotation.x = Math.atan2(-2, 5);

// OPÇÃO 3: lookAt + ajuste de roll
camera.position.set(-5, 2, 0);
camera.lookAt(0, 0, 0);
camera.rotation.z = Math.PI / 4;  // Ajuste fino do roll
```

## 📚 Resumo

| Aspecto | rotation | lookAt |
|---------|----------|--------|
| **Input** | Ângulos (radianos) | Ponto alvo (x,y,z) |
| **Cálculo** | Manual | Automático |
| **Intuitividade** | Baixa | Alta |
| **Controle de Roll** | Total | Limitado |
| **Uso comum** | Animações, FPS | Órbita, seguir objetos |
| **Sobrescreve** | Nada | rotation (exceto Z em alguns casos) |

## 💡 Dica Pro

Para câmeras que seguem objetos mas mantêm roll:

```javascript
// Salva roll atual
const currentRoll = camera.rotation.z;

// Aponta para o alvo
camera.lookAt(target);

// Restaura roll
camera.rotation.z = currentRoll;
```

Ou use Quaternions para controle total sem gimbal lock:

```javascript
const quaternion = new THREE.Quaternion();
quaternion.setFromRotationMatrix(
    new THREE.Matrix4().lookAt(camera.position, target, camera.up)
);
camera.quaternion.copy(quaternion);
```
