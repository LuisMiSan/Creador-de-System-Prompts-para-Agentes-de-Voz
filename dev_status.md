# Estado del Proyecto: Creador de System Prompts

**Fecha:** 24 de mayo de 2024

## 1. Resumen del Proyecto

El objetivo de la aplicación es proporcionar una herramienta web intuitiva para que los usuarios creen "system prompts" detallados y efectivos para agentes de voz de IA. La interfaz guía al usuario a través de varios campos para definir el comportamiento del agente, y luego utiliza un modelo de IA (actualmente simulado) para generar un prompt optimizado y bien estructurado.

## 2. Estado Actual de las Funcionalidades

La aplicación es funcional en modo de prueba (`mock`). La interfaz de usuario está completa, es responsiva y ofrece una experiencia de usuario sólida.

### Funcionalidades Implementadas:
- [x] **Formulario Detallado:** Un formulario completo con campos para definir rol, tarea, personalidad, tono, contexto, directrices, flujo y notas del agente.
- [x] **Componente `InputField` Sofisticado:** Incluye etiquetas flotantes para una mejor UX y legibilidad.
- [x] **Dictado por Voz:** Integración de `SpeechRecognition` para rellenar campos del formulario usando el micrófono. El sistema detecta si el navegador es compatible.
- [x] **Plantillas de Ejemplo (`PromptExamples`):** Una sección con tres ejemplos predefinidos (Atención al Cliente, Ventas, Soporte Técnico) para que los usuarios puedan empezar rápidamente. Al seleccionar una plantilla, se autocompleta el formulario.
- [x] **Generación de Prompt (Simulada):** El servicio `geminiService.ts` actualmente devuelve una respuesta mock estática y simula una demora de red para mostrar el estado de carga.
- [x] **Historial Persistente:** Los prompts generados se guardan en el `localStorage`.
- [x] **Panel de Historial (`HistoryDrawer`):** Un panel inferior desplegable que muestra la lista de prompts guardados. Permite seleccionar un prompt antiguo para cargarlo de nuevo en la aplicación.
- [x] **Gestión del Historial:** Funcionalidad para limpiar todo el historial guardado.
- [x] **Exportación de Datos:** El historial completo se puede exportar en formatos **Markdown (.md)** y **PDF** (usando la función de impresión del navegador).
- [x] **Autoguardado de Borradores:** El contenido del formulario se guarda automáticamente en `localStorage`. Si el usuario recarga la página, se le notifica y se le ofrece la opción de restaurar el borrador.
- [x] **Notificaciones Toast:** Mensajes emergentes para confirmar acciones como "Copiado", "Plantilla cargada" o "Guardado en la base de datos".
- [x] **UI/UX Pulida:** Diseño limpio y moderno con TailwindCSS, iconos SVG, animaciones y estados de carga/error bien definidos.

### Componentes No Integrados (Pero existentes):
- `ApiKeyManager.tsx`: Existe un componente completo para gestionar API Keys (añadir, eliminar, seleccionar), pero **no está siendo utilizado ni es accesible desde la interfaz principal (`App.tsx`) actualmente.**

## 3. Arquitectura y Puntos Clave

- **Stack:** React, TypeScript, TailwindCSS. No hay dependencias externas de librerías de componentes.
- **Servicio de IA:** `services/geminiService.ts` está aislado y es el único lugar que necesita ser modificado para conectar con la API real de Gemini.
- **Gestión de Estado:** Se maneja localmente en `App.tsx` con `useState` y `useRef`. Los datos persistentes (historial, borradores, claves) se guardan en `localStorage`.
- **Tipado:** Se utiliza TypeScript con interfaces claras en `types.ts` para los modelos de datos (`VoiceAgentPromptData`, `PromptHistoryItem`).

## 4. Próximos Pasos / Tareas Pendientes

1.  **Activar la API de Gemini:**
    -   Modificar `services/geminiService.ts` para eliminar la respuesta mock.
    -   Implementar la lógica para construir un "meta-prompt" a partir del `promptData` del usuario.
    -   Realizar la llamada real a la API de `@google/genai` usando el modelo apropiado (ej. `gemini-2.5-flash`).
    -   Procesar y mostrar la respuesta real de la API.

2.  **Integrar el Gestor de API Keys:**
    -   Añadir un botón (ej. un icono de engranaje o llave en la cabecera o junto al historial) para abrir el modal `ApiKeyManager`.
    -   Implementar la lógica para guardar y gestionar las claves en `localStorage` a través del componente `App.tsx`.
    -   Asegurarse de que la clave activa seleccionada se pase al `geminiService` para autenticar las llamadas a la API.

3.  **Mejorar el Manejo de Errores de la API:**
    -   Ampliar el manejo de errores actual para capturar y mostrar mensajes específicos de la API (ej. clave inválida, cuota excedida, contenido bloqueado).

4.  **Refinar el Prompt Enviado a Gemini:**
    -   Iterar sobre la estructura del prompt que se envía a la IA para asegurar que la calidad de los "system prompts" generados sea óptima y siga las mejores prácticas.
