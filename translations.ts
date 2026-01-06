
export type Language = 'es' | 'en';

export const translations = {
    es: {
        // App Header
        subtitle: "GENERADOR DE AGENTES DE VOZ",
        description: "Diseña prompts efectivos para agentes de voz con inteligencia artificial avanzada.",
        
        // AutoSave
        draftDetected: "Borrador detectado.",
        restoreDraft: "¿Restaurar contenido no guardado?",
        restoreBtn: "Restaurar",
        
        // Form Section
        configTitle: "Configuración del Agente",
        clearBtn: "Limpiar",
        
        // Inputs
        roleLabel: "Rol del Agente",
        rolePlaceholder: "Ej: Eres Maria, una asistente virtual amigable...",
        roleHelp: "Describe quién es el agente y su propósito principal. (Obligatorio)",
        
        taskLabel: "Tarea Principal",
        taskPlaceholder: "Ej: Proveer información de servicios y cualificar clientes.",
        taskHelp: "El objetivo clave que el agente debe cumplir. (Obligatorio)",
        
        personalityLabel: "Personalidad",
        personalityPlaceholder: "Ej: Cercana, espontánea, servicial...",
        personalityHelp: "Define el estilo y la forma de hablar del agente.",
        
        toneLabel: "Tono y Lenguaje",
        tonePlaceholder: "Ej: Formal, usa 'usted', lenguaje técnico...",
        toneHelp: "Especifica el tono y las reglas del lenguaje a usar.",
        
        contextLabel: "Contexto (Base de Conocimiento)",
        contextPlaceholder: "Ej: Servicios: Corte (30€), Tinte (50€). Horario: L-V 10-20h...",
        contextHelp: "Toda la información que el agente necesita para responder preguntas.",
        
        guidelinesLabel: "Directrices de Respuesta",
        guidelinesPlaceholder: "Ej: Sé siempre amable. Usa frases cortas...",
        guidelinesHelp: "Reglas sobre cómo deben ser las respuestas del agente.",
        
        stepByStepLabel: "Flujo de Conversación (Paso a Paso)",
        stepByStepPlaceholder: "Ej: 1. Saludar. 2. Preguntar nombre. 3. Pedir email...",
        stepByStepHelp: "Define un guion o los pasos que el agente debe seguir.",
        
        notesLabel: "Notas Adicionales",
        notesPlaceholder: "Ej: Evitar temas no relacionados...",
        notesHelp: "Reglas específicas o manejo de casos excepcionales.",
        
        nicheLabel: "Nicho del Prompt",
        nichePlaceholder: "Ej: Peluquería, Inmobiliaria, Restaurante...",
        nicheHelp: "Categoriza este prompt para encontrarlo fácilmente. (Obligatorio)",
        
        // InputField Tooltips & Aria
        titleAutocomplete: "Autocompletar con IA",
        ariaGenerate: "Generar contenido con IA",
        ariaMic: "Activar dictado por voz",
        titleMic: "Dictar por voz",

        // Buttons
        processBtn: "Generar System Prompt",
        processingBtn: "Procesando...",
        saveDbBtn: "Guardar en DB",
        
        // Output Section
        generatedTitle: "System Prompt Generado",
        processingAgent: "Procesando Agente IA...",
        shareBtn: "Compartir",
        copyBtn: "Copiar",
        copiedBtn: "Copiado",
        btnSavePDF: "Guardar PDF",
        
        // Messages & Toasts
        toastSharedLoaded: "¡Prompt compartido cargado con éxito!",
        toastTemplateLoaded: "Plantilla cargada. ¡Ya puedes editarla!",
        errorFieldRequired: "El campo '{0}' es obligatorio y debe tener al menos {1} caracteres.",
        errorNoPrompt: "No hay ningún prompt generado para guardar.",
        toastDuplicate: "Este prompt ya está en tu historial.",
        toastSavedDB: "Prompt guardado en la base de datos",
        toastDownloadingMD: "Descargando archivo Markdown...",
        errorDownload: "Error al descargar el archivo.",
        errorNoPDFContent: "Error: No hay contenido para generar PDF",
        toastGeneratingPDF: "Generando PDF... por favor espera",
        toastPDFDownloaded: "PDF descargado correctamente",
        errorPDFGen: "Error al generar el archivo PDF.",
        errorShareLink: "No se pudo crear el enlace para compartir.",
        confirmDelete: "¿Estás seguro de que quieres borrar este prompt?",
        toastDeleted: "Prompt eliminado.",
        toastVarUpdated: "Variable actualizada",
        errorGenSuggestions: "Error generando sugerencias. Por favor intenta de nuevo.",
        toastContentInserted: "Contenido insertado correctamente",

        // History
        historyTitle: "Historial de Procesamiento",
        historySubtitle: "Registros de base de datos y salidas generadas.",
        searchPlaceholder: "Buscar registros...",
        exportBtn: "Exportar",
        printBtn: "PDF",
        noHistory: "No hay historial de procesamiento",
        noHistorySub: "Genera tu primer prompt para llenar esta tabla.",
        noMatches: "No se encontraron coincidencias",
        errorPDFHistory: "Error al generar el PDF del historial.",
        
        // Markdown Export Content
        mdTitle: "Mi Base de Datos de Prompts",
        mdPromptFor: "Prompt para",
        mdNoNiche: "Sin Nicho",
        mdDate: "Fecha",
        mdInputData: "Datos de Entrada",
        mdDynamicVars: "Variables Dinámicas",
        mdGeneratedPrompt: "Prompt Generado",

        // Table Headers
        thNiche: "Nicho / Etiqueta",
        thAgent: "Definición del Agente",
        thDate: "Fecha",
        thAction: "Acción",
        
        // History Details
        detailLog: "Detalles del Registro",
        detailRole: "Rol del Agente",
        detailTask: "Tarea",
        detailPersonality: "Personalidad",
        detailTone: "Tono",
        detailContext: "Contexto / Base de Conocimiento",
        detailGuidelines: "Directrices",
        detailVars: "Variables Definidas",
        detailOutput: "Salida Compilada",
        
        // Examples
        templatesTitle: "Plantillas Base",
        templatesSubtitle: "Selecciona una configuración para inicializar el agente.",
        loadTemplateBtn: "Cargar Plantilla",
        
        // Dynamic Vars
        varsTitle: "Variables Dinámicas",
        varsDesc: "Define variables para reutilizar este prompt. Úsalas arriba con la sintaxis",
        addVarBtn: "Añadir Variable",
        selectVarPlaceholder: "Selecciona una variable...",
        customVarOption: "Otra (Personalizada)...",
        customVarPlaceholder: "nombre_personalizado",
        valPlaceholder: "Valor de Ejemplo",
        
        // Dynamic Vars Aria/Labels
        ariaName: "Nombre de la variable personalizada {0}",
        ariaSelect: "Nombre de la variable {0}",
        ariaMicName: "Dictar nombre de variable {0}",
        ariaValue: "Valor de la variable {0}",
        ariaMicValue: "Dictar valor de variable {0}",
        ariaDelete: "Eliminar variable {0}",

        // Predefined Vars
        varClientName: "Nombre del Cliente",
        varAgentName: "Nombre del Agente",
        varCompany: "Empresa del Cliente",
        varDate: "Fecha Actual",
        varTime: "Hora Actual",
        varOrderNum: "Número de Pedido",
        varProduct: "Producto/Servicio",
        varReason: "Motivo de la Llamada",
        
        // Markdown Editor
        tabPreview: "Vista Previa",
        tabRaw: "Código Markdown",
        editVarTitle: "Editar Variable",
        editVarName: "Nombre Variable",
        editVarVal: "Valor",
        updateSysBtn: "Actualizar Sistema",
        ariaEditor: "Editor de Markdown",
        titleEditVar: "Clic para editar variable",
        
        // Share Modal
        shareTitle: "Compartir Prompt",
        shareDesc: "Cualquier persona con este enlace podrá ver y cargar una copia de tu prompt generado.",
        linkPlaceholder: "Enlace para compartir",
        ariaClose: "Cerrar modal",
        ariaLink: "Enlace para compartir",

        // Suggestions Modal
        suggestionTitle: "Generador de Opciones IA",
        suggestionSubtitle: "Selecciona la opción que mejor se adapte a tu agente:",
        generating: "Generando ideas...",
        useThisOption: "Usar esta opción",
        closeBtn: "Cerrar",
        errorPrerequisites: "Por favor, completa primero el 'Rol del Agente' y la 'Tarea Principal' para generar sugerencias."
    },
    en: {
        // App Header
        subtitle: "VOICE AGENT GENERATOR",
        description: "Design effective prompts for AI voice agents with advanced intelligence.",
        
        // AutoSave
        draftDetected: "Draft detected.",
        restoreDraft: "Restore unsaved content?",
        restoreBtn: "Restore",
        
        // Form Section
        configTitle: "Agent Configuration",
        clearBtn: "Clear",
        
        // Inputs
        roleLabel: "Agent Role",
        rolePlaceholder: "Ex: You are Maria, a friendly virtual assistant...",
        roleHelp: "Describe who the agent is and their main purpose. (Required)",
        
        taskLabel: "Main Task",
        taskPlaceholder: "Ex: Provide service info and qualify leads.",
        taskHelp: "The key objective the agent must fulfill. (Required)",
        
        personalityLabel: "Personality",
        personalityPlaceholder: "Ex: Approachable, spontaneous, helpful...",
        personalityHelp: "Define the style and way of speaking.",
        
        toneLabel: "Tone and Language",
        tonePlaceholder: "Ex: Formal, use 'sir/madam', technical language...",
        toneHelp: "Specify the tone and language rules to use.",
        
        contextLabel: "Context (Knowledge Base)",
        contextPlaceholder: "Ex: Services: Cut ($30), Dye ($50). Hours: M-F 10-20h...",
        contextHelp: "All information the agent needs to answer questions.",
        
        guidelinesLabel: "Response Guidelines",
        guidelinesPlaceholder: "Ex: Always be polite. Use short sentences...",
        guidelinesHelp: "Rules on how the agent's responses should be.",
        
        stepByStepLabel: "Conversation Flow (Step-by-Step)",
        stepByStepPlaceholder: "Ex: 1. Greet. 2. Ask name. 3. Ask for email...",
        stepByStepHelp: "Define a script or steps the agent must follow.",
        
        notesLabel: "Additional Notes",
        notesPlaceholder: "Ex: Avoid unrelated topics...",
        notesHelp: "Specific rules or handling exceptional cases.",
        
        nicheLabel: "Prompt Niche",
        nichePlaceholder: "Ex: Hair Salon, Real Estate, Restaurant...",
        nicheHelp: "Categorize this prompt to find it easily. (Required)",

        // InputField Tooltips & Aria
        titleAutocomplete: "Autocomplete with AI",
        ariaGenerate: "Generate content with AI",
        ariaMic: "Activate voice dictation",
        titleMic: "Dictate by voice",
        
        // Buttons
        processBtn: "Generate System Prompt",
        processingBtn: "Processing...",
        saveDbBtn: "Save to DB",
        
        // Output Section
        generatedTitle: "Generated System Prompt",
        processingAgent: "Processing AI Agent...",
        shareBtn: "Share",
        copyBtn: "Copy",
        copiedBtn: "Copied",
        btnSavePDF: "Save PDF",
        
        // Messages & Toasts
        toastSharedLoaded: "Shared prompt loaded successfully!",
        toastTemplateLoaded: "Template loaded. You can edit it now!",
        errorFieldRequired: "The field '{0}' is required and must have at least {1} characters.",
        errorNoPrompt: "There is no generated prompt to save.",
        toastDuplicate: "This prompt is already in your history.",
        toastSavedDB: "Prompt saved to database",
        toastDownloadingMD: "Downloading Markdown file...",
        errorDownload: "Error downloading file.",
        errorNoPDFContent: "Error: No content to generate PDF",
        toastGeneratingPDF: "Generating PDF... please wait",
        toastPDFDownloaded: "PDF downloaded successfully",
        errorPDFGen: "Error generating PDF file.",
        errorShareLink: "Could not create share link.",
        confirmDelete: "Are you sure you want to delete this prompt?",
        toastDeleted: "Prompt deleted.",
        toastVarUpdated: "Variable updated",
        errorGenSuggestions: "Error generating suggestions. Please try again.",
        toastContentInserted: "Content inserted successfully",
        
        // History
        historyTitle: "Processing History",
        historySubtitle: "Database records and generated outputs.",
        searchPlaceholder: "Search logs...",
        exportBtn: "Export",
        printBtn: "PDF",
        noHistory: "No processing history yet",
        noHistorySub: "Generate your first prompt to populate this table.",
        noMatches: "No matches found",
        errorPDFHistory: "Error generating history PDF.",

        // Markdown Export Content
        mdTitle: "My Prompt Database",
        mdPromptFor: "Prompt for",
        mdNoNiche: "No Niche",
        mdDate: "Date",
        mdInputData: "Input Data",
        mdDynamicVars: "Dynamic Variables",
        mdGeneratedPrompt: "Generated Prompt",
        
        // Table Headers
        thNiche: "Niche / Tag",
        thAgent: "Agent Definition",
        thDate: "Date",
        thAction: "Action",
        
        // History Details
        detailLog: "System Log Details",
        detailRole: "Agent Role",
        detailTask: "Task",
        detailPersonality: "Personality",
        detailTone: "Tone",
        detailContext: "Context / Knowledge Base",
        detailGuidelines: "Guidelines",
        detailVars: "Defined Variables",
        detailOutput: "Compiled Output",
        
        // Examples
        templatesTitle: "Core Templates",
        templatesSubtitle: "Select a preset configuration to initialize agent.",
        loadTemplateBtn: "Load Template",
        
        // Dynamic Vars
        varsTitle: "Dynamic Variables",
        varsDesc: "Define variables to reuse this prompt. Use them above with syntax",
        addVarBtn: "Add Variable",
        selectVarPlaceholder: "Select a variable...",
        customVarOption: "Other (Custom)...",
        customVarPlaceholder: "custom_name",
        valPlaceholder: "Example Value",

        // Dynamic Vars Aria/Labels
        ariaName: "Custom variable name {0}",
        ariaSelect: "Variable name {0}",
        ariaMicName: "Dictate variable name {0}",
        ariaValue: "Variable value {0}",
        ariaMicValue: "Dictate variable value {0}",
        ariaDelete: "Delete variable {0}",

        // Predefined Vars
        varClientName: "Client Name",
        varAgentName: "Agent Name",
        varCompany: "Client Company",
        varDate: "Current Date",
        varTime: "Current Time",
        varOrderNum: "Order Number",
        varProduct: "Product/Service",
        varReason: "Call Reason",
        
        // Markdown Editor
        tabPreview: "Preview Output",
        tabRaw: "Raw Markdown",
        editVarTitle: "Edit Variable",
        editVarName: "Variable Name",
        editVarVal: "Value",
        updateSysBtn: "Update System",
        ariaEditor: "Markdown Editor",
        titleEditVar: "Click to edit variable",
        
        // Share Modal
        shareTitle: "Share Prompt",
        shareDesc: "Anyone with this link can view and load a copy of your generated prompt.",
        linkPlaceholder: "Share link",
        ariaClose: "Close modal",
        ariaLink: "Share link",

        // Suggestions Modal
        suggestionTitle: "AI Option Generator",
        suggestionSubtitle: "Select the option that best fits your agent:",
        generating: "Generating ideas...",
        useThisOption: "Use this option",
        closeBtn: "Close",
        errorPrerequisites: "Please complete 'Agent Role' and 'Main Task' first to generate suggestions."
    }
};
