# Controle 3D com Celular

Aplicação web que permite controlar um modelo 3D no PC usando o giroscópio do celular via WebRTC.

## Estrutura do Projeto

```
peer/
├── index.html                  # Estrutura HTML
├── styles.css                  # Estilos da aplicação
└── js/
    ├── app.js                  # Controller principal
    ├── state.js                # Estado global da aplicação
    ├── utils.js                # Funções utilitárias
    ├── orientation-mapper.js   # Mapeamento de orientações
    ├── scene-3d.js            # Gerenciamento da cena 3D
    ├── host-connection.js     # Lógica do host (PC)
    ├── client-connection.js   # Lógica do cliente (celular)
    └── sensor-manager.js      # Gerenciamento de sensores
```

## Módulos

### `state.js`
Estado centralizado da aplicação compartilhado entre todos os módulos.

### `utils.js`
Funções utilitárias como geração de ID, logging e clipboard.

### `orientation-mapper.js`
Diferentes modos de mapeamento entre giroscópio e rotação 3D:
- `portrait`: Celular em modo vertical
- `landscape`: Celular em modo horizontal
- `direct`: Mapeamento direto XYZ
- `direct-swapped`: XY trocados (padrão)
- `inverted`: Mapeamento invertido

### `scene-3d.js`
Gerenciamento completo da cena Three.js:
- Criação da cena, câmera e renderer
- Iluminação
- Modelo 3D do celular
- Loop de animação

### `host-connection.js`
Lógica do PC que recebe dados de orientação:
- Inicialização do PeerJS
- Recebimento de dados
- Atualização do modelo 3D

### `client-connection.js`
Lógica do celular que envia dados:
- Conexão com o host
- Envio de dados de orientação

### `sensor-manager.js`
Gerenciamento dos sensores do dispositivo:
- Detecção de disponibilidade
- Requisição de permissões (iOS)
- Captura e envio de dados
- Throttling (30fps)

### `app.js`
Controller principal exposto globalmente para event handlers HTML.

## Como usar

1. Abra `index.html` no PC
2. Clique em "Sou o PC"
3. Copie o ID gerado
4. No celular, acesse o mesmo arquivo
5. Clique em "Sou o Controle"
6. Digite o ID do PC
7. Conecte e mova o celular

## Requisitos

- HTTPS (obrigatório para sensores de orientação)
- Navegador moderno com suporte a WebRTC e DeviceOrientation
- Permissões de sensores (iOS 13+)

## Tecnologias

- Three.js: Renderização 3D
- PeerJS: Conexão P2P via WebRTC
- DeviceOrientation API: Sensores do celular
- ES6 Modules: Modularização
