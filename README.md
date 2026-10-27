# Diário de Lugares

Aplicativo Expo/React Native criado a partir da estrutura do projeto Agudos Connect, para registrar lugares visitados com foto, descrição, data e coordenadas GPS.

## Funcionalidades
- Tirar uma foto usando `expo-camera`.
- Obter a localização atual usando `expo-location`.
- Salvar título, descrição, foto (URI local), coordenadas e data no aparelho com AsyncStorage.
- Listar registros salvos e excluir registros.
- Não precisa de Supabase: os registros são locais, no dispositivo.

## Como executar
1. Instale Node.js LTS e tenha o Android Studio/emulador configurado ou use um celular com Expo Go compatível.
2. No terminal, entre nesta pasta.
3. Execute:
   ```powershell
   npm install
   npx expo install --check
   npx expo start
   ```
4. Para Android conectado/configurado:
   ```powershell
   npx expo start --android
   ```

## Teste de localização no emulador
No Android Studio, abra o emulador, entre em **Settings > Location** e ative a localização. Se necessário, no menu estendido do emulador, abra **Location** e defina uma posição. A câmera pode não funcionar como num celular físico; para testar a captura de foto, prefira um telefone real com Expo Go.

## Observações
- As permissões de câmera e localização são solicitadas durante o uso.
- O AsyncStorage guarda os registros no dispositivo. A imagem tirada pelo Expo Camera é retornada como URI local de cache; para um projeto de produção, seria recomendável copiar as fotos para uma pasta persistente do aplicativo.
- Não há backend nem banco Supabase neste projeto porque a atividade pede armazenamento local.
