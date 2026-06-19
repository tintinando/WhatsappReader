# WhatsApp Chat Viewer

Una aplicación web para visualizar chats exportados de WhatsApp de manera local y privada en tu navegador.

## Descripción

Esta aplicación lee la carpeta que contiene el archivo de texto (`_chat.txt`) exportado desde la aplicación de WhatsApp en tu teléfono, junto con todos los archivos multimedia (imágenes, videos, audios, documentos, etc.), y los renderiza de forma hermosa y navegable directamente en el navegador.

Todo el procesamiento se realiza **localmente** en tu dispositivo. No se envía ningún dato a servidores externos, garantizando tu privacidad.

## Características

- 📁 Soporte completo para exportaciones de WhatsApp (archivos `_chat.txt`)
- 🖼️ Renderizado de imágenes
- 🔍 Búsqueda de mensajes
- 📱 Diseño responsive (móvil y escritorio)
- 🌙 Modo oscuro por defecto
- ⚡ Carga progresiva y eficiente de archivos grandes

### por implementar:

- 🖼️ Renderizado de videos, audios y documentos
- 📅 Agrupación de mensajes por fecha

## Tecnologías Utilizadas

- **Vite** - Build tool y servidor de desarrollo
- **Vanilla TypeScript** - Sin frameworks pesados
- **Tailwind CSS** - Estilos modernos y responsivos
- **pnpm** - Gestor de paquetes
- **WebKit FileSystem Entry API** - Acceso al sistema de archivos local del navegador

## Instalación

### Prerrequisitos

- Node.js (v18 o superior)
- pnpm

### Pasos

1. Clona el repositorio:

   ```
   git clone <url-del-repositorio>
   cd whatsapp-chat-viewer
   ```

2. Instalar las dependencias:

   ```
   pnpm install
   ```

3. Ejecutar en modo desarrollo:

   ```
   pnpm dev
   ```

4. Compilar y distribuir:
   ```
   pnpm build
   ```
