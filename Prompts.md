# Prompt 1

actua como ingeniero fullstack con amplia experiencia en revisión de código. Analiza los proyectos @backend y @frontend y genera un archivo AGENTS.md para cada uno de ellos siguiendo los estándares definidos en https://agents.md/. Para el proyecto @backend ten en cuenta los archivos @backend/ManifestoBuenasPracticas.md y @backend/ModeloDatos.md 

# Prompt 2

/speckit.constitution Primero, lee los archivos AGENTS.md, tanto de frontend como de backend, y extrae el stack tecnológico real, los patrones arquitectónicos y las convenciones que se describen allí; úsalos como base para los principios a continuación, no escribas principios genéricos. Crea principios enfocados en: (1) calidad del código — siguiendo los patrones y convenciones existentes que se encuentran en los archivos AGENTS.md, no usar frameworks/librerías nuevos sin aprobación explícita; (2) estándares de prueba: TDD estricto (escribir primero la prueba que falla) a nivel de pruebas unitarias para la lógica de negocio, servicios y funciones utilitarias; pruebas de integración requeridas para cualquier código que toque la base de datos o APIs externas; pruebas de componentes (React Testing Library) para componentes frontend, probando comportamiento, no implementación; pruebas E2E solo para los caminos de usuario críticos, no para cobertura exhaustiva; cobertura mínima del 80% en pruebas unitarias para la lógica de negocio del backend; (3) consistencia UX — reutilizar el sistema de diseño/componentes existentes descritos en el AGENTS.md de frontend, sin estilos ad-hoc; (4) rendimiento — Para Frontend toma como referencia los Core Web Vitals de Google.Para backend lecturas simples (un GET a un solo recurso) deberían responder bajo 100-200ms en p95; escrituras (POST/PUT con validación y persistencia) bajo 300-500ms en p95; y operaciones complejas hasta 2 segundos en p95.

# Prompt 3

/speckit.specify Se debe crear la interfaz "Position", una página que permita visualizar y gestionar los diferentes candidatos de una posición específica.

El siguiente diseño de Figma sirve como referencia visual del comportamiento y disposición esperados de la interfaz: https://www.figma.com/make/3WhnADrBPJqHpFLgNruL85/Kanban-para-gesti%C3%B3n-de-candidatos

Acceso a la página:
En el componente "Positions", cada tarjeta de posición cuenta con un botón "Ver proceso". Al hacer clic en este botón, el sistema debe navegar a la página de detalle de esa posición específica, mostrando la información correspondiente a la posición seleccionada.

Encabezado:
Se debe mostrar el título de la posición en la parte superior de la página, para dar contexto al usuario sobre en qué proceso se encuentra. A la izquierda del título debe haber una flecha que permita volver al listado de posiciones ("Positions").

Tablero de candidatos:
La página debe mostrar un tablero organizado en columnas, donde cada columna representa una fase del proceso de contratación de la posición. Se deben mostrar tantas columnas como fases tenga definidas el proceso.

En cada columna se deben listar, como tarjetas, los candidatos que se encuentran actualmente en esa fase. Cada tarjeta debe mostrar el nombre completo del candidato y su puntuación media.

Gestión de candidatos:
El usuario debe poder cambiar la fase en la que se encuentra un candidato arrastrando su tarjeta desde la columna actual hacia otra columna. Este es el único mecanismo mediante el cual se debe permitir actualizar la fase de un candidato desde esta interfaz.

Responsive:
La página debe visualizarse adecuadamente en dispositivos móviles. En esta vista, las fases (columnas) deben mostrarse en disposición vertical, ocupando todo el ancho de la pantalla.

# Prompt 4
/speckit-plan

# Prompt 5
/speckit-tasks

# Prompt 6
/speckit-implement


